const { test } = require('node:test');
const assert = require('node:assert/strict');
const { isPolicyBlocked, policySummary, parseBlockOn } = require('../../../out/core/SeverityPolicy');

test('policy thresholds include their boundary and leave lower severities alone', () => {
    const severities = ['critical', 'high', 'medium', 'low'];
    assert.deepEqual(severities.map(s => isPolicyBlocked(s, 'off')), [false, false, false, false]);
    assert.deepEqual(severities.map(s => isPolicyBlocked(s, 'critical')), [true, false, false, false]);
    assert.deepEqual(severities.map(s => isPolicyBlocked(s, 'high')), [true, true, false, false]);
});
test('invalid configuration defaults off and summaries include zero findings', () => {
    for (const value of [undefined, null, true, 'medium', 'HIGH', {}]) {
        assert.equal(parseBlockOn(value), 'off');
    }
    assert.equal(policySummary([], 'off'), '');
    assert.equal(policySummary([], 'critical'), 'Policy: 0 blocking findings (critical)');
    assert.equal(policySummary([{ severity: 'critical' }, { severity: 'high' }], 'high'),
        'Policy: 2 blocking findings (high or above)');
});
