import { exec } from 'child_process';
import spawn = require('cross-spawn');
import * as fs from 'fs/promises';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { CLIInvocation } from '../types';
import { extractReviewJSON } from './ReviewJSON';

export async function runCLIReview(options: { command: CLIInvocation; cwd: string; prompt: string }): Promise<string> {
    const stdout = await new Promise<string>((resolve, reject) => {
        const settings = { cwd: options.cwd, maxBuffer: 4 * 1024 * 1024, timeout: 300000 };
        const done = (error: Error | null, output: string) => error ? reject(error) : resolve(output);
        const command = options.command;
        const child = typeof command === 'string'
            ? exec(command, settings, done)
            : spawn(command.file, command.promptArgument ? [...command.args, options.prompt] : command.args, { cwd: options.cwd });
        if (typeof command !== 'string') {
            const chunks: Buffer[] = [];
            let stdoutBytes = 0;
            let stderrBytes = 0;
            const fail = (error: Error) => { clearTimeout(timer); child.kill(); reject(error); };
            const timer = setTimeout(() => fail(new Error('CLI review timed out')), settings.timeout);
            child.on('error', error => { clearTimeout(timer); reject(error); });
            child.stdin?.on('error', fail);
            child.stdout?.on('data', (chunk: Buffer) => {
                stdoutBytes += chunk.length;
                if (stdoutBytes > settings.maxBuffer) { fail(new Error('CLI stdout exceeds 4 MB')); }
                else { chunks.push(chunk); }
            });
            child.stderr?.on('data', (chunk: Buffer) => {
                stderrBytes += chunk.length;
                if (stderrBytes > settings.maxBuffer) { fail(new Error('CLI stderr exceeds 4 MB')); }
            });
            child.on('close', code => {
                clearTimeout(timer);
                if (code !== 0) { reject(new Error(`CLI exited with code ${code}`)); }
                else { resolve(Buffer.concat(chunks).toString('utf8')); }
            });
        }
        child.stdin?.on('error', reject);
        child.stdin?.end(typeof command !== 'string' && command.promptArgument ? undefined : options.prompt);
    });
    const json = extractReviewJSON(stdout);
    const directory = path.join(options.cwd, '.ai-code-review', 'results');
    await fs.mkdir(directory, { recursive: true });
    const file = path.join(directory, `code-review-result-${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID()}.json`);
    const temporary = `${file}.tmp`;
    await fs.writeFile(temporary, json, 'utf8');
    await fs.rename(temporary, file);
    return file;
}
