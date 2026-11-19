import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { extractReviewJSON } from './ReviewJSON';

export async function runCLIReview(options: {
    command: string; cwd: string; prompt: string;
    signal?: AbortSignal; onStdout?: (chunk: string) => void;
}): Promise<string> {
    options.signal?.throwIfAborted();
    let stderrTail = '';
    const stdout = await new Promise<string>((resolve, reject) => {
        const child = spawn(options.command, {
            cwd: options.cwd, shell: true, detached: process.platform !== 'win32', windowsHide: true
        });
        let output = '';
        let bytes = 0;
        let failure: Error | undefined;
        const stop = (error: Error) => {
            if (failure) { return; }
            failure = error;
            if (!child.pid) { return; }
            if (process.platform === 'win32') {
                const killer = spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { windowsHide: true });
                killer.on('error', reject);
            } else {
                try { process.kill(-child.pid, 'SIGKILL'); }
                catch (killError) {
                    if (!(killError instanceof Error && 'code' in killError && killError.code === 'ESRCH')) {
                        reject(killError);
                    }
                }
            }
        };
        const cancel = () => stop(new Error('CLI review cancelled.'));
        options.signal?.addEventListener('abort', cancel, { once: true });
        const timer = setTimeout(() => stop(new Error('CLI review timed out.')), 300000);
        child.stdout.setEncoding('utf8');
        child.stderr.setEncoding('utf8');
        child.stdout.on('data', (chunk: string) => {
            bytes += Buffer.byteLength(chunk);
            if (bytes > 4 * 1024 * 1024) { stop(new Error('CLI review output exceeded 4 MB.')); return; }
            output += chunk;
            options.onStdout?.(chunk);
        });
        child.stderr.on('data', (chunk: string) => { stderrTail = (stderrTail + chunk).slice(-4096); });
        child.on('error', error => { failure = error; });
        child.on('close', code => {
            clearTimeout(timer);
            options.signal?.removeEventListener('abort', cancel);
            if (failure) { reject(new Error(`${failure.message}\n${stderrTail}`)); }
            else if (code !== 0) { reject(new Error(`Command failed (exit ${code}): ${stderrTail}`)); }
            else { resolve(output); }
        });
        child.stdin.on('error', error => stop(error));
        child.stdin.end(options.prompt);
        if (options.signal?.aborted) { cancel(); }
    });
    options.signal?.throwIfAborted();
    let json: string;
    try { json = extractReviewJSON(stdout); }
    catch (error) { throw new Error(`${error instanceof Error ? error.message : String(error)}\n${stderrTail}`); }
    const directory = path.join(options.cwd, '.ai-code-review', 'results');
    await fs.mkdir(directory, { recursive: true });
    const file = path.join(directory, `code-review-result-${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID()}.json`);
    const temporary = `${file}.tmp`;
    try {
        await fs.writeFile(temporary, json, 'utf8');
        options.signal?.throwIfAborted();
        await fs.rename(temporary, file);
    } catch (error) {
        await fs.rm(temporary, { force: true });
        throw error;
    }
    return file;
}
