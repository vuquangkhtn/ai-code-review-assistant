import * as fs from 'fs/promises';
import { constants } from 'fs';
import * as path from 'path';
import { CLIInvocation } from '../types';

const presets = [
    { id: 'codex', args: ['--ask-for-approval', 'never', 'exec', '--sandbox', 'read-only', '-'] },
    { id: 'claude', args: ['-p', '--output-format', 'text'] },
    { id: 'copilot', args: ['--silent', '--allow-tool=read', '-p'] }
];

export async function selectCLICommand(options: {
    customCommand: string;
    savedProvider: string | undefined;
    choose: (providers: string[]) => PromiseLike<string | undefined>;
    save: (provider: string) => PromiseLike<void>;
}): Promise<CLIInvocation | undefined> {
    if (options.customCommand.trim()) { return options.customCommand.trim(); }
    const available: { id: string; file: string; args: string[] }[] = [];
    for (const preset of presets) {
        for (const directory of (process.env.PATH || '').split(path.delimiter).filter(Boolean)) {
            for (const extension of process.platform === 'win32' ? ['.exe', '.com', '.cmd', '.bat'] : ['']) {
                const file = path.resolve(directory.replace(/^"|"$/g, ''), preset.id + extension);
                try {
                    await fs.access(file, process.platform === 'win32' ? constants.F_OK : constants.X_OK);
                    if (!(await fs.stat(file)).isFile()) { continue; }
                    available.push({ ...preset, file });
                    break;
                } catch { /* Not executable on this PATH entry. */ }
            }
            if (available.some(provider => provider.id === preset.id)) { break; }
        }
    }
    if (!available.length) {
        throw new Error('No supported CLI found on PATH. Install Codex, Claude Code or Copilot CLI, or set aiCodeReview.cli.customCommand.');
    }
    let selected = available.find(provider => provider.id === options.savedProvider);
    if (!selected) {
        const id = available.length === 1 ? available[0].id : await options.choose(available.map(provider => provider.id));
        if (!id) { return undefined; }
        selected = available.find(provider => provider.id === id);
        if (!selected) { throw new Error('Selected CLI is no longer available.'); }
        await options.save(selected.id);
    }
    return { file: selected.file, args: selected.args, promptArgument: selected.id === 'copilot' };
}
