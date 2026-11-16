export function extractReviewJSON(text: string): string {
    const starts: number[] = [];
    let quoted = false;
    let escaped = false;
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (starts.length && quoted) {
            if (escaped) { escaped = false; }
            else if (char === '\\') { escaped = true; }
            else if (char === '"') { quoted = false; }
        } else if (char === '{') {
            starts.push(i);
        } else if (starts.length && char === '"') {
            quoted = true;
        } else if (char === '}' && starts.length) {
            const start = starts.pop();
            const candidate = text.slice(start, i + 1);
            try {
                const value: unknown = JSON.parse(candidate);
                if (value && typeof value === 'object' && 'issues' in value && Array.isArray(value.issues)) {
                    return candidate;
                }
            } catch { /* A banner can contain braces without being JSON. */ }
        }
    }
    throw new Error('CLI output does not contain a review JSON object with an issues array');
}
