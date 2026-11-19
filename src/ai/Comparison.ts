import { ComparisonGroup, ProviderReview } from '../types';

export function groupComparison(reviews: ProviderReview[]): ComparisonGroup[] {
    const groups = new Map<string, ComparisonGroup>();
    for (const review of reviews) {
        for (const issue of review.issues) {
            const key = JSON.stringify([issue.filePath, issue.lineNumber]);
            let group = groups.get(key);
            if (!group) {
                group = { filePath: issue.filePath, lineNumber: issue.lineNumber, findings: [] };
                groups.set(key, group);
            }
            const title = issue.title.trim().toLowerCase();
            let finding = group.findings.find(item => item.entries[0].issue.title.trim().toLowerCase() === title);
            if (!finding) { finding = { entries: [] }; group.findings.push(finding); }
            if (!finding.entries.some(entry => entry.provider === review.provider)) {
                finding.entries.push({ provider: review.provider, issue });
            }
        }
    }
    return [...groups.values()].sort((a, b) => a.filePath.localeCompare(b.filePath) || a.lineNumber - b.lineNumber);
}
