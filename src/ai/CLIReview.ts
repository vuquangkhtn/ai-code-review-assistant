import { spawn } from 'child_process';
import spawnShim = require('cross-spawn');
import * as fs from 'fs/promises';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { CLIInvocation, CLIReviewProgress } from '../types';
import { extractReviewJSON } from './ReviewJSON';

function startCLI(command: CLIInvocation, prompt: string, cwd: string) {
    if (typeof command === 'string') {
        return spawn(command, { cwd, shell: true, detached: process.platform !== 'win32', windowsHide: true });
    }
    const args = command.promptArgument ? [...command.args, prompt] : command.args;
    // cross-spawn resolves Windows shims (.cmd) that plain spawn refuses without a shell.
    return spawnShim(command.file, args, { cwd, detached: process.platform !== 'win32', windowsHide: true });
}

export async function runCLIReview(options: {
    command: CLIInvocation; cwd: string; prompt: string;
    signal?: AbortSignal; onStdout?: (chunk: string) => void;
    review?: { type: string; files: string[] };
    onProgress?: (progress: CLIReviewProgress) => void;
}): Promise<string> {
    options.signal?.throwIfAborted();
    const files = [...new Set(options.review?.files.map(file => file.replace(/\\/g, '/')))];
    const reviewed = new Set<string>();
    const reportProgress = () => {
        const progress = { reviewed: reviewed.size, total: files.length };
        options.onStdout?.(`\n[progress] reviewed ${progress.reviewed}/${progress.total} files\n--- provider output ---\n`);
        options.onProgress?.(progress);
    };
    const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const mentions = (output: string, file: string, final: boolean) => {
        const boundary = '[^a-zA-Z0-9_./-]';
        return new RegExp(`(^|${boundary})${escape(file)}(?=${boundary}${final ? '|$' : ''})`).test(output);
    };
    const updateProgress = (output: string, final = false) => {
        const normalized = output.replace(/\\+/g, '/');
        const before = reviewed.size;
        for (const file of files) {
            if (reviewed.has(file)) { continue; }
            const basename = path.posix.basename(file);
            const unique = files.filter(candidate => path.posix.basename(candidate) === basename).length === 1;
            if (mentions(normalized, file, final) || (unique && mentions(normalized, basename, final))) {
                reviewed.add(file);
            }
        }
        if (reviewed.size !== before) { reportProgress(); }
    };
    if (options.review) {
        const command = typeof options.command === 'string' ? options.command
            : [options.command.file, ...options.command.args].join(' ');
        options.onStdout?.(`=== CLI review ===\nCommand: ${command}\nReview type: ${options.review.type}\nFiles:\n${files.map(file => `  ${file}`).join('\n')}\nTotal files: ${files.length}\n`);
        reportProgress();
    }
    let stderrTail = '';
    const stdout = await new Promise<string>((resolve, reject) => {
        const child = startCLI(options.command, options.prompt, options.cwd);
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
        child.stdout?.setEncoding('utf8');
        child.stderr?.setEncoding('utf8');
        child.stdout?.on('data', (chunk: string) => {
            bytes += Buffer.byteLength(chunk);
            if (bytes > 4 * 1024 * 1024) { stop(new Error('CLI review output exceeded 4 MB.')); return; }
            output += chunk;
            options.onStdout?.(chunk);
            if (options.review) { updateProgress(output); }
        });
        child.stderr?.on('data', (chunk: string) => { stderrTail = (stderrTail + chunk).slice(-4096); });
        child.on('error', error => { failure = error; });
        child.on('close', code => {
            clearTimeout(timer);
            options.signal?.removeEventListener('abort', cancel);
            if (options.review) { updateProgress(output, true); }
            if (failure) { reject(new Error(`${failure.message}\n${stderrTail}`)); }
            else if (code !== 0) { reject(new Error(`Command failed (exit ${code}): ${stderrTail}`)); }
            else { resolve(output); }
        });
        child.stdin?.on('error', error => stop(error));
        child.stdin?.end(typeof options.command !== 'string' && options.command.promptArgument ? undefined : options.prompt);
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
