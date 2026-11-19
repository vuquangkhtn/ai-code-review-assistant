const fs = require('node:fs');
const assert = require('node:assert/strict');
let prompt = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { prompt += chunk; });
process.stdin.on('end', () => {
    assert.match(prompt, /You are an expert code reviewer/);
    assert.match(prompt, /Respond with a JSON object only/);
    assert.doesNotMatch(prompt, /How to Use This Review Result|File Output Instructions/);
    const changes = prompt.match(/Changes File:\*\* `([^`]+)`/)[1];
    assert.match(fs.readFileSync(changes, 'utf8'), /sample.js/);
    fs.writeFileSync('received-prompt.txt', prompt);
    if (process.argv.includes('fail')) { process.exit(7); }
    if (process.argv.includes('invalid')) { console.log('No review available'); return; }
    const result = { issues: [{ type: 'bug', severity: 'high', file: 'sample.js', line: 1,
        title: 'Fixture CLI issue', description: 'Fixture result from stdin', suggestion: 'Use const' }] };
    const comparison = process.argv.find(arg => arg === 'compare-one' || arg === 'compare-two');
    if (comparison) {
        fs.writeFileSync(`${comparison}-prompt.txt`, prompt);
        result.issues[0].confidence = 'high';
        result.issues[0].evidence = 'sample.js:1 declares a mutable binding';
        result.issues.push({ ...result.issues[0], title: `Only ${comparison}` });
    }
    if (process.argv.includes('noisy')) { console.log('Starting {not JSON} banner'); }
    console.log(JSON.stringify(result));
    if (process.argv.includes('noisy')) { console.log('Finished {usage: 1}'); }
});
