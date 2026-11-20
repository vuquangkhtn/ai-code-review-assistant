const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const workspacePath = fs.mkdtempSync(path.join(os.tmpdir(), 'manual-prompt-'));
after(() => fs.rmSync(workspacePath, { recursive: true, force: true }));

let selection;
let clipboard;
const notifications = [];
const commands = [];
const originalLoad = Module._load;
Module._load = function (id, ...args) {
    if (id === 'vscode') return {
        workspace: { workspaceFolders: [{ uri: { fsPath: workspacePath } }] },
        env: { clipboard: { writeText: async text => { clipboard = text; } } },
        window: {
            showInformationMessage: async (...args) => { notifications.push(args); return selection; },
            showErrorMessage: message => assert.fail(message)
        },
        commands: { executeCommand: async command => { commands.push(command); } }
    };
    return originalLoad.call(this, id, ...args);
};
let ExternalAIManager;
try { ({ ExternalAIManager } = require('../../../out/ai/ExternalAIManager')); }
finally { Module._load = originalLoad; }

for (const type of ['local', 'branch']) {
    for (const action of ['Paste to AI Chat…', 'Open Changes', undefined]) {
        test(`${type} completion offers guidance and handles ${action ?? 'dismissal'}`, async () => {
            selection = action;
            notifications.length = 0;
            commands.length = 0;
            clipboard = undefined;
            const manager = ExternalAIManager.getInstance();
            const changeInfo = { type, source: 'main', target: 'feature', files: [] };
            let detected;
            manager.setChangeDetector({
                detectAndStoreLocalChanges: async () => {
                    detected = 'local';
                    return { changeInfo, filePath: '/fixture/local-changes.json' };
                },
                detectAndStoreBranchChanges: async (source, target) => {
                    assert.equal(source, 'main');
                    assert.equal(target, 'feature');
                    detected = 'branch';
                    return { changeInfo, filePath: '/fixture/branch-changes.json' };
                }
            });
            await manager.copyPromptToClipboard({ changeInfo, aiProvider: 'external' });
            assert.equal(detected, type);
            assert.match(clipboard, /File location: .ai-code-review\/prompts\//);
            const promptPath = await manager.getLastPromptFilePath();
            assert.match(fs.readFileSync(promptPath, 'utf8'), new RegExp(`${type}-changes.json`));
            assert.deepEqual(notifications, [[
                `Prompt For ${type === 'local' ? 'Local' : 'Branch'} Changes copied to clipboard!`,
                'Open Changes', 'Paste to AI Chat…'
            ]]);
            assert.deepEqual(commands, action === undefined ? [] : [
                action === 'Open Changes' ? 'aiCodeReview.openChangeFile' : 'aiCodeReview.pastePrompt'
            ]);
        });
    }
}
