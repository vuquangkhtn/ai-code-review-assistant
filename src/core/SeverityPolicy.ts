import { CodeIssue, SeverityBlockOn } from '../types';

export function parseBlockOn(value: unknown): SeverityBlockOn {
    return value === 'critical' || value === 'high' ? value : 'off';
}

export function isPolicyBlocked(severity: string, blockOn: SeverityBlockOn): boolean {
    return blockOn !== 'off' && (severity === 'critical' || (blockOn === 'high' && severity === 'high'));
}

export function policySummary(issues: readonly Pick<CodeIssue, 'severity'>[], blockOn: SeverityBlockOn): string {
    if (blockOn === 'off') return '';
    const count = issues.filter(issue => isPolicyBlocked(issue.severity, blockOn)).length;
    return `Policy: ${count} blocking findings (${blockOn === 'high' ? 'high or above' : 'critical'})`;
}
