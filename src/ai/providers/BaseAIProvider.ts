import { ReviewRequest, ReviewResult } from '../../types';

export interface BaseAIProvider {
    id: string;
    name: string;
    isAvailable: boolean;
    
    performReview(request: ReviewRequest): Promise<ReviewResult>;
    testConnection(): Promise<boolean>;
    getCapabilities(): any;
}

export abstract class AbstractAIProvider implements BaseAIProvider {
    public abstract readonly id: string;
    public abstract readonly name: string;
    public abstract readonly isAvailable: boolean;

    public abstract performReview(request: ReviewRequest): Promise<ReviewResult>;
    public abstract testConnection(): Promise<boolean>;
    public abstract getCapabilities(): any;

    protected formatPrompt(request: ReviewRequest): string {
        const { changeInfo, options } = request;
        
        let prompt = `Please review the following code changes and provide feedback in this exact format:

Issue Level: [Low/Medium/High/Critical]
Issue: [Brief description of the issue]
Suggestions:
- [Specific suggestion with code example if applicable]
- [Additional suggestions as needed]

Focus on:
- Code quality and best practices
- Security concerns
- Performance implications
- Maintainability
- Testing considerations

Code Changes:
Type: ${changeInfo.type}
Source: ${changeInfo.source}
${changeInfo.target ? `Target: ${changeInfo.target}` : ''}

Files Changed:
`;

        for (const file of changeInfo.files) {
            prompt += `\n${file.path} (${file.status})`;
            if (file.diff) {
                prompt += `\n\`\`\`diff\n${file.diff}\n\`\`\``;
            }
        }

        prompt += `\n\nPlease provide a comprehensive code review following the template above.`;

        return prompt;
    }

    protected parseAIResponse(response: string): any[] {
        // This is a basic parser - in practice, you'd want more robust parsing
        const issues: any[] = [];
        const issueBlocks = response.split(/(?=Issue Level:)/g).filter(block => block.trim());

        for (const block of issueBlocks) {
            try {
                const severityMatch = block.match(/Issue Level:\s*(Low|Medium|High|Critical)/i);
                const issueMatch = block.match(/Issue:\s*(.+?)(?=\nSuggestions:|$)/s);
                const suggestionsMatch = block.match(/Suggestions:\s*((?:- .+?\n?)+)/s);

                if (severityMatch && issueMatch) {
                    const suggestions = suggestionsMatch 
                        ? suggestionsMatch[1].split('\n').filter(s => s.trim().startsWith('-')).map(s => s.trim().substring(2))
                        : [];

                    issues.push({
                        severity: severityMatch[1].toLowerCase(),
                        issue: issueMatch[1].trim(),
                        suggestions
                    });
                }
            } catch (error) {
                console.error('Failed to parse issue block:', error);
            }
        }

        return issues;
    }
}
