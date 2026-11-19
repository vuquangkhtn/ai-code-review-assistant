const Module = require('node:module');
const assert = require('node:assert/strict');
const path = require('node:path');
const load = Module._load;
Module._load = function(id, ...args) {
  if (id === 'vscode') return {workspace: {workspaceFolders: []}};
  return load.call(this, id, ...args);
};
const {CodeReviewPanel} = require('../../../../out/ui/CodeReviewPanel');
const {ResponseParser} = require('../../../../out/ai/ResponseParser');
Module._load = load;
(async () => {
  const {chromium} = require(process.env.QA_PLAYWRIGHT);
  const browser = await chromium.launch({headless: true, executablePath: process.env.QA_CHROMIUM});
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => { window.acquireVsCodeApi = () => ({postMessage() {}}); });
    const panel = {webview: {onDidReceiveMessage() {}}, onDidDispose() {}};
    CodeReviewPanel.revive(panel, {});
    const issue = {file: 'src/example.ts', line: 2, severity: 'high', type: 'bug', title: 'Unchecked result', description: 'The result can be empty.', suggestion: 'Check it.'};
    const parsed = ResponseParser.parseResponse(JSON.stringify({issues: [
      {...issue, confidence: 'high', evidence: 'src/example.ts:2 returns null'},
      {...issue, title: 'Legacy finding without metadata'},
      {...issue, title: 'Medium confidence finding', confidence: 'medium'},
      {...issue, title: 'Low confidence finding', confidence: 'low'}
    ]}), 'qa', []).issues;
    // Use the production webview document; only the VS Code host bridge is replaced.
    await page.goto('about:blank');
    await page.evaluate(() => { window.acquireVsCodeApi = () => ({postMessage() {}}); });
    await page.setContent(panel.webview.html);
    await page.evaluate(issues => window.postMessage({command: 'updateIssues', issues}, '*'), parsed);
    await page.locator('.issue-item').first().waitFor();
    assert.equal(await page.locator('.issue-item').count(), 4);
    assert.deepEqual(await page.locator('.issue-confidence').allTextContents(), ['· high confidence', '· medium confidence', '· low confidence']);
    assert.equal(await page.locator('.issue-item').nth(1).locator('.issue-confidence').count(), 0);
    for (const [name, width, height] of [['desktop',1920,1080],['tablet',1024,768],['mobile',375,667]]) {
      await page.setViewportSize({width,height});
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await page.screenshot({path: path.join(__dirname, name + '.png'), fullPage: true});
    }
    assert.deepEqual(errors, []);
    console.log('PASS: production webview HTML, 4 parsed findings, 3 confidence labels, unchanged legacy finding, no horizontal overflow at desktop/tablet/mobile, zero page errors. Host bridge stubbed; not a live VS Code screenshot.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
