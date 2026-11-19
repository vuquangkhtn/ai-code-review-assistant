import * as assert from 'assert';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { suite, test } from 'mocha';
import { ResponseParser } from '../../ai/ResponseParser';
import { groupComparison } from '../../ai/Comparison';
import { ComparisonTreeProvider } from '../../ui/ComparisonTreeProvider';

suite('Two-provider comparison', () => {
    test('registered command runs two fixture CLIs on one prompt and groups their saved results', async function () {
        this.timeout(20000);
        const extension = vscode.extensions.getExtension('vuquangkhtn.ai-code-review-assistant');
        assert.ok(extension);
        await extension.activate();
        const workspace = vscode.workspace.workspaceFolders?.[0];
        const node = process.env.CLI_TEST_NODE;
        assert.ok(workspace && node);
        const config = vscode.workspace.getConfiguration('aiCodeReview');
        const previous = config.inspect('cli.comparisonCommands')?.globalValue;
        const fixture = path.join(extension.extensionPath, 'src/test/fixtures/review.cjs');
        const results = path.join(workspace.uri.fsPath, '.ai-code-review/results');
        const before = new Set(fs.existsSync(results) ? fs.readdirSync(results) : []);
        await config.update('cli.comparisonCommands', {
            Alpha: `"${node}" "${fixture}" compare-one`, Beta: `"${node}" "${fixture}" compare-two`
        }, vscode.ConfigurationTarget.Global);
        const tree = new ComparisonTreeProvider();
        try {
            const running = vscode.commands.executeCommand('aiCodeReview.compareCLIReviews');
            // The two configured entries start checked; accept the real multi-select UI.
            await new Promise(resolve => setTimeout(resolve, 1000));
            await vscode.commands.executeCommand('workbench.action.acceptSelectedQuickOpenItem');
            await running;
            const files = fs.readdirSync(results).filter(name => name.endsWith('.json') && !before.has(name));
            assert.strictEqual(files.length, 2);
            assert.strictEqual(fs.readFileSync(path.join(workspace.uri.fsPath, 'compare-one-prompt.txt'), 'utf8'),
                fs.readFileSync(path.join(workspace.uri.fsPath, 'compare-two-prompt.txt'), 'utf8'));
            const reviews = files.map((file, i) => {
                const result = ResponseParser.parseResponse(fs.readFileSync(path.join(results, file), 'utf8'), String(i), []);
                assert.ok(result);
                return { provider: String(i), issues: result.issues };
            });
            tree.update(groupComparison(reviews));
            const locations = tree.getChildren();
            assert.strictEqual(locations.length, 1);
            const findings = tree.getChildren(locations[0]);
            assert.strictEqual(findings.filter(item => String(item.label).startsWith('Shared:')).length, 1);
            assert.strictEqual(findings.filter(item => String(item.label).startsWith('Unique:')).length, 2);
            const shared = tree.getChildren(findings[0]);
            assert.strictEqual(shared.length, 2);
            assert.strictEqual(shared[0].description, 'Confidence: high');
            assert.match(String(shared[0].tooltip), /Evidence: sample.js:1/);
        } finally {
            tree.dispose();
            await config.update('cli.comparisonCommands', previous, vscode.ConfigurationTarget.Global);
        }
    });
});
