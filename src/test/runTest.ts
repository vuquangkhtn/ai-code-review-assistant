import * as path from 'path';
import { runTests } from '@vscode/test-electron';

async function main() {
    try {
        // The folder containing the Extension Manifest package.json
        // Passed to `--extensionDevelopmentPath`
        const extensionDevelopmentPath = path.resolve(__dirname, '../../');

        // The path to test runner
        // Passed to --extensionTestsPath
        const extensionTestsPath = path.resolve(__dirname, './suite/index');

        // The workspace folder to open during tests (test-examples for realistic testing)
        const workspacePath = path.resolve(__dirname, '../../test-examples');

        // Download VS Code, unzip it and run the integration test
        await runTests({ 
            extensionDevelopmentPath, 
            extensionTestsPath,
            launchArgs: [workspacePath] // Open test-examples as workspace
        });
    } catch (err) {
        console.error('Failed to run tests');
        process.exit(1);
    }
}

main();