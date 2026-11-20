import * as fs from 'fs/promises';
import { constants } from 'fs';
import * as path from 'path';
import { CLIInvocation } from '../types';

// Data-driven registry: adding a provider is one entry here — detection, selection,
// persistence, the comparison fallback and the switcher pick it up without further changes.
// promptArgument: the prompt is appended as a literal last argument (copilot -p, zcode -p)
// instead of being piped to stdin (codex, claude).
export const cliPresets = [
    { id: 'codex', args: ['--ask-for-approval', 'never', 'exec', '--sandbox', 'read-only', '-'], promptArgument: false },
    { id: 'claude', args: ['-p', '--output-format', 'text'], promptArgument: false },
    { id: 'copilot', args: ['--silent', '--allow-tool=read', '-p'], promptArgument: true },
    { id: 'zcode', args: ['-p'], promptArgument: true }
];
const presets = cliPresets;

export interface DetectedCLI { id: string; file: string; args: string[]; promptArgument: boolean; }

export async function detectCLIPresets(): Promise<DetectedCLI[]> {
    const available: { id: string; file: string; args: string[]; promptArgument: boolean }[] = [];
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
    return available;
}

export async function selectCLICommand(options: {
    customCommand: string;
    savedProvider: string | undefined;
    defaultProvider?: string;
    choose: (providers: string[]) => PromiseLike<string | undefined>;
    save: (provider: string) => PromiseLike<void>;
}): Promise<CLIInvocation | undefined> {
    if (options.customCommand.trim()) { return options.customCommand.trim(); }
    const available = await detectCLIPresets();
    if (!available.length) {
        throw new Error('No supported CLI found on PATH. Install Codex, Claude Code, Copilot CLI or zcode, or set aiCodeReview.cli.customCommand.');
    }
    const wanted = options.defaultProvider?.trim();
    const forced = wanted && wanted !== 'auto' ? wanted : undefined;
    let selected = forced ? available.find(provider => provider.id === forced) : undefined;
    if (forced && !selected) {
        throw new Error(`aiCodeReview.cli.defaultProvider is '${forced}' but the ${forced} CLI was not found on PATH. Install it or set the setting to 'auto'.`);
    }
    if (!selected) { selected = available.find(provider => provider.id === options.savedProvider); }
    if (!selected) {
        const id = available.length === 1 ? available[0].id : await options.choose(available.map(provider => provider.id));
        if (!id) { return undefined; }
        selected = available.find(provider => provider.id === id);
        if (!selected) { throw new Error('Selected CLI is no longer available.'); }
        await options.save(selected.id);
    }
    return { file: selected.file, args: selected.args, promptArgument: selected.promptArgument };
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
            message: `Comparison needs two CLI providers. Install at least two supported CLIs (Codex, Claude Code, Copilot CLI or zcode), or set at least two named commands in aiCodeReview.cli.comparisonCommands, e.g. ${comparisonExample}.`
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

export type CLISwitchResult =
    | { kind: 'switched'; provider: string }
    | { kind: 'cancelled' }
    | { kind: 'error'; message: string };

export async function switchCLIProvider(options: {
    customCommand: string;
    defaultProviderSetting: string;
    persistedProvider: string | undefined;
    choose: (items: { id: string; label: string; description: string }[]) => PromiseLike<string | undefined>;
    save: (provider: string) => PromiseLike<void>;
    saveSetting: (provider: string) => PromiseLike<void>;
}): Promise<CLISwitchResult> {
    const detected = await detectCLIPresets();
    const wanted = options.defaultProviderSetting?.trim();
    const settingForced = wanted && wanted !== 'auto' ? wanted : undefined;
    const current = options.customCommand.trim() ? 'custom'
        : settingForced ?? (detected.some(provider => provider.id === options.persistedProvider) ? options.persistedProvider : undefined);
    const items = detected.map(provider => ({
        id: provider.id,
        label: provider.id,
        description: provider.id === current ? '(current)' : ''
    }));
    if (settingForced && !detected.some(provider => provider.id === settingForced)) {
        items.push({ id: settingForced, label: settingForced, description: 'not found on PATH (current)' });
    }
    if (options.customCommand.trim()) {
        items.push({
            id: 'custom',
            label: 'custom command',
            description: `${options.customCommand.trim()}${current === 'custom' ? ' (current)' : ''}`
        });
    }
    if (!items.length) {
        return { kind: 'error', message: 'No supported CLI found on PATH. Install Codex, Claude Code, Copilot CLI or zcode, or set aiCodeReview.cli.customCommand.' };
    }
    const picked = await options.choose(items);
    if (!picked) { return { kind: 'cancelled' }; }
    if (picked === 'custom') { return { kind: 'switched', provider: 'custom' }; }
    const known = detected.some(provider => provider.id === picked) || picked === settingForced;
    if (!known) { return { kind: 'cancelled' }; }
    await options.save(picked);
    if (settingForced && settingForced !== picked) { await options.saveSetting(picked); }
    return { kind: 'switched', provider: picked };
}

export interface FailureRecovery { message: string; alternatives: string[]; }

export function suggestFailureRecovery(options: {
    failedProvider?: string;
    detected: string[];
}): FailureRecovery {
    const alternatives = options.detected.filter(id => id !== options.failedProvider);
    if (alternatives.length) {
        return {
            alternatives,
            message: `Switch provider: run "AI Code Review: Select CLI Provider" and pick ${alternatives.join(' or ')}.`
        };
    }
    return {
        alternatives: [],
        message: 'No other CLI provider is detected. Check the AI Code Review CLI output channel for diagnostics, then review the aiCodeReview.cli settings (custom command or default provider).'
    };
}
