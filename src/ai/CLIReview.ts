import { exec, execFile } from 'child_process';
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
            : execFile(command.file, command.promptArgument ? [...command.args, options.prompt] : command.args, settings, done);
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
