import * as fs from 'fs/promises';
import { constants } from 'fs';
import * as path from 'path';
import { CLIInvocation } from '../types';

const presets = [
    { id: 'codex', args: ['--ask-for-approval', 'never', 'exec', '--sandbox', 'read-only', '-'] },
    { id: 'claude', args: ['-p', '--output-format', 'text'] },
    { id: 'copilot', args: ['--silent', '--allow-tool=read', '-p'] }
];

export interface DetectedCLI { id: string; file: string; args: string[]; promptArgument: boolean; }

export async function detectCLIPresets(): Promise<DetectedCLI[]> {
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
    return available.map(provider => ({ ...provider, promptArgument: provider.id === 'copilot' }));
}

export async function selectCLICommand(options: {
    customCommand: string;
    savedProvider: string | undefined;
    choose: (providers: string[]) => PromiseLike<string | undefined>;
    save: (provider: string) => PromiseLike<void>;
}): Promise<CLIInvocation | undefined> {
    if (options.customCommand.trim()) { return options.customCommand.trim(); }
    const available = await detectCLIPresets();
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

export type ComparisonSelection =
    | { kind: 'providers'; providers: { label: string; command: CLIInvocation }[] }
    | { kind: 'cancelled' }
    | { kind: 'error'; message: string };

const comparisonExample = '{"claude": "claude -p --output-format text", "codex": "codex --ask-for-approval never exec --sandbox read-only -"}';

export async function selectComparisonProviders(options: {
    configured: Record<string, string>;
    choose: (items: { label: string; picked: boolean }[]) => PromiseLike<{ label: string }[] | undefined>;
}): Promise<ComparisonSelection> {
    const named = Object.entries(options.configured).filter(([, command]) => typeof command === 'string' && command.trim());
    if (named.length >= 2) {
        const picked = await options.choose(named.map(([label]) => ({ label, picked: named.length === 2 })));
        if (!picked) { return { kind: 'cancelled' }; }
        const commandsByName = new Map(named.map(([label, command]) => [label, command.trim()]));
        const providers: { label: string; command: CLIInvocation }[] = [];
        for (const { label } of picked) {
            const command = commandsByName.get(label);
            if (command !== undefined) { providers.push({ label, command }); }
        }
        return providers.length === 2
            ? { kind: 'providers', providers }
            : { kind: 'error', message: 'Select exactly two providers.' };
    }
    if (named.length === 1) {
        return { kind: 'error', message: `Comparison needs two provider commands. Set at least two named commands in aiCodeReview.cli.comparisonCommands, e.g. ${comparisonExample}.` };
    }
    const detected = await detectCLIPresets();
    if (detected.length < 2) {
        return {
            kind: 'error',
            message: `Comparison needs two CLI providers. Install at least two supported CLIs (Codex, Claude Code or Copilot CLI), or set at least two named commands in aiCodeReview.cli.comparisonCommands, e.g. ${comparisonExample}.`
        };
    }
    let chosen = detected;
    if (detected.length > 2) {
        const picked = await options.choose(detected.map(provider => ({ label: provider.id, picked: false })));
        if (!picked) { return { kind: 'cancelled' }; }
        const labels = new Set(picked.map(item => item.label));
        chosen = detected.filter(provider => labels.has(provider.id));
        if (chosen.length !== 2) { return { kind: 'error', message: 'Select exactly two providers.' }; }
    }
    return {
        kind: 'providers',
        providers: chosen.map(provider => ({ label: provider.id, command: { file: provider.file, args: provider.args, promptArgument: provider.promptArgument } }))
    };
}
