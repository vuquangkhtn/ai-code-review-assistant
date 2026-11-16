import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { execFileSync } from 'child_process';
import { downloadAndUnzipVSCode, runTests } from '@vscode/test-electron';

export function resolveVSCodeExecutable(downloaded: string): string {
    const code = path.join(path.dirname(downloaded), 'Code');
    if (path.basename(downloaded) === 'Electron' && path.basename(path.dirname(downloaded)) === 'MacOS'
        && !fs.existsSync(downloaded) && fs.existsSync(code)) {
        return code;
    }
    return downloaded;
}

async function main() {
    const fixtureWorkspace = process.env.CLI_REVIEW_TEST ? fs.mkdtempSync(path.join(os.tmpdir(), 'cli-review-')) : undefined;
    try {
        // The folder containing the Extension Manifest package.json
        // Passed to `--extensionDevelopmentPath`
        const extensionDevelopmentPath = path.resolve(__dirname, '../../');

        // The path to test runner
        // Passed to --extensionTestsPath
        const extensionTestsPath = path.resolve(__dirname, './suite/index');

        // The workspace folder to open during tests (test-examples for realistic testing)
        const workspacePath = fixtureWorkspace || path.resolve(__dirname, '../../test-examples');
        if (fixtureWorkspace) {
            execFileSync('git', ['init'], { cwd: fixtureWorkspace });
            fs.writeFileSync(path.join(fixtureWorkspace, 'sample.js'), 'let answer = 42;\n');
        }

        // Download VS Code, unzip it and run the integration test
        await runTests({ 
            extensionDevelopmentPath,
            vscodeExecutablePath: process.env.CLI_TEST_VSCODE
                || resolveVSCodeExecutable(await downloadAndUnzipVSCode()),
            extensionTestsEnv: { CLI_TEST_NODE: process.execPath },
            extensionTestsPath,
            launchArgs: [workspacePath, '--skip-welcome', '--disable-workspace-trust'] // Open test-examples as workspace
        });
    } catch (err) {
        console.error('Failed to run tests', err);
        process.exitCode = 1;
    } finally {
        if (fixtureWorkspace) { fs.rmSync(fixtureWorkspace, { recursive: true, force: true }); }
    }
}

if (require.main === module) { main(); }