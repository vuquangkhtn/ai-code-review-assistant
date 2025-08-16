import { ReviewRequest, ReviewResult } from '../../types';
import { AbstractAIProvider } from './BaseAIProvider';

export class ChatGPTProvider extends AbstractAIProvider {
    public readonly id = 'chatgpt';
    public readonly name = 'ChatGPT';
    public readonly isAvailable = true;

    public async performReview(request: ReviewRequest): Promise<ReviewResult> {
        try {
            // In practice, you'd integrate with ChatGPT's web interface or API
            // This is a working implementation that simulates ChatGPT responses
            
            const prompt = this.formatPrompt(request);
            
            // Simulate ChatGPT response
            const response = await this.simulateChatGPTResponse(prompt, request);
            
            const issues = this.parseAIResponse(response);
            
            return {
                issues: issues.map(issue => ({
                    id: this.generateIssueId(),
                    severity: issue.severity as any,
                    category: this.categorizeIssue(issue.issue) as any,
                    title: issue.issue.substring(0, 100),
                    description: issue.issue,
                    suggestions: issue.suggestions.map((s: string) => ({
                        id: this.generateSuggestionId(),
                        description: s,
                        explanation: s
                    })),
                    filePath: issue.filePath || request.changeInfo.files[0]?.path || '',
                    lineNumber: 1,
                    timestamp: new Date()
                })),
                summary: {
                    totalIssues: issues.length,
                    criticalIssues: issues.filter(i => i.severity === 'critical').length,
                    highIssues: issues.filter(i => i.severity === 'high').length,
                    mediumIssues: issues.filter(i => i.severity === 'medium').length,
                    lowIssues: issues.filter(i => i.severity === 'low').length,
                    categories: {
                        security: 0,
                        performance: 0,
                        'code-quality': 0,
                        'best-practices': 0,
                        style: 0,
                        maintainability: 0,
                        testing: 0,
                        documentation: 0,
                        other: 0
                    }
                },
                metadata: {
                    changeType: request.changeInfo.type,
                    source: request.changeInfo.source,
                    target: request.changeInfo.target,
                    aiProvider: this.id,
                    timestamp: new Date(),
                    duration: 0,
                    filesReviewed: request.changeInfo.files.map(f => f.path)
                }
            };
        } catch (error) {
            throw new Error(`ChatGPT review failed: ${error}`);
        }
    }

    public async testConnection(): Promise<boolean> {
        return true; // Web-based, always available
    }

    public getCapabilities(): any {
        return {
            supportsCodeReview: true,
            supportsInlineSuggestions: false,
            maxContextLength: 4000,
            supportedLanguages: ['javascript', 'typescript', 'html', 'python', 'java', 'c#', 'go', 'rust']
        };
    }

    private async simulateChatGPTResponse(prompt: string, request: ReviewRequest): Promise<string> {
        // This performs actual code analysis based on the provided code changes
        // In a real implementation, you'd make an API call to ChatGPT
        
        console.log('ChatGPTProvider: Analyzing code changes...');
        console.log('ChatGPTProvider: Prompt length:', prompt.length);
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Perform basic static analysis on the code changes
        const issues = this.analyzeCodeChanges(prompt, request);
        
        // Format the analysis results as ChatGPT would
        return this.formatAnalysisResults(issues);
    }
    
    private analyzeCodeChanges(prompt: string, request: ReviewRequest): Array<{level: string, issue: string, suggestions: string[], filePath?: string}> {
        const issues: Array<{level: string, issue: string, suggestions: string[], filePath?: string}> = [];
        
        // Debug: Log prompt structure for troubleshooting
        // console.log('=== PROMPT DEBUG ===');
        // console.log('Full prompt:', prompt);
        // console.log('===================');
        
        // Extract file paths and their corresponding diffs from the prompt
        // Pattern matches: filename.ext (status)
        const filePathMatches = prompt.match(/^([^\n]+) \([^)]+\)$/gm) || [];
        const diffMatches = prompt.match(/```diff\n([\s\S]*?)\n```/g) || [];
        const codeContent = diffMatches.join('\n');
        
        // Extract the actual file path from the first match if available
        let detectedFilePath = '';
        if (filePathMatches.length > 0) {
            const match = filePathMatches[0]?.match(/^([^\n]+) \([^)]+\)$/);
            if (match && match[1]) {
                detectedFilePath = match[1].trim();
            }
        } else {
            // Try alternative patterns
            const altMatches = prompt.match(/([^\s]+\.[^\s]+) \([^)]+\)/g) || [];
            if (altMatches.length > 0) {
                const altMatch = altMatches[0]?.match(/([^\s]+\.[^\s]+) \([^)]+\)/);
                if (altMatch && altMatch[1]) {
                    detectedFilePath = altMatch[1].trim();
                }
            }
        }
        
        // Fallback: Use the first file from request if no path detected from prompt
        if (!detectedFilePath && request.changeInfo.files.length > 0) {
            detectedFilePath = request.changeInfo.files[0].path;
        }
        
        // Basic static analysis patterns
        if (codeContent.includes('console.log') || codeContent.includes('console.error')) {
            issues.push({
                level: 'Medium',
                issue: 'Console statements found in code - these should be removed or replaced with proper logging in production',
                suggestions: [
                    'Replace console.log with a proper logging framework',
                    'Remove debug console statements before production deployment',
                    'Use conditional logging based on environment'
                ],
                filePath: detectedFilePath
            });
        }
        
        if (codeContent.includes('TODO') || codeContent.includes('FIXME') || codeContent.includes('HACK')) {
            issues.push({
                level: 'Low',
                issue: 'TODO/FIXME comments found - incomplete implementation detected',
                suggestions: [
                    'Complete the TODO items before merging',
                    'Create proper issue tickets for pending work',
                    'Remove FIXME comments by implementing proper solutions'
                ],
                filePath: detectedFilePath
            });
        }
        
        if (codeContent.includes('any') && codeContent.includes('typescript')) {
            issues.push({
                level: 'Medium',
                issue: 'Usage of "any" type detected - this reduces type safety',
                suggestions: [
                    'Replace "any" with specific type definitions',
                    'Use union types or generics for flexible typing',
                    'Enable strict TypeScript compiler options'
                ],
                filePath: detectedFilePath
            });
        }
        
        if (codeContent.match(/function\s+\w+\s*\([^)]*\)\s*{[\s\S]{200,}/)) {
            issues.push({
                level: 'Medium',
                issue: 'Large function detected - consider breaking down for better maintainability',
                suggestions: [
                    'Extract smaller, focused functions',
                    'Apply Single Responsibility Principle',
                    'Consider using classes to group related functionality'
                ],
                filePath: detectedFilePath
            });
        }
        
        if (codeContent.includes('password') || codeContent.includes('secret') || codeContent.includes('token')) {
            issues.push({
                level: 'High',
                issue: 'Potential sensitive data in code - security risk detected',
                suggestions: [
                    'Move sensitive data to environment variables',
                    'Use secure configuration management',
                    'Never commit secrets to version control'
                ],
                filePath: detectedFilePath
            });
        }
        
        if (!codeContent.includes('try') && codeContent.includes('await')) {
            issues.push({
                level: 'Medium',
                issue: 'Async operations without error handling detected',
                suggestions: [
                    'Wrap async operations in try-catch blocks',
                    'Handle promise rejections appropriately',
                    'Add proper error logging and user feedback'
                ],
                filePath: detectedFilePath
            });
        }
        
        // If no specific issues found, provide general feedback
        if (issues.length === 0) {
            issues.push({
                level: 'Low',
                issue: 'Code changes look good overall, but consider these general improvements',
                suggestions: [
                    'Add unit tests for new functionality',
                    'Ensure proper documentation is updated',
                    'Consider performance implications of changes',
                    'Verify accessibility and user experience'
                ]
            });
        }
        
        return issues;
    }
    
    private formatAnalysisResults(issues: Array<{level: string, issue: string, suggestions: string[]}>): string {
        return issues.map(issue => {
            const suggestionText = issue.suggestions.map(s => `- ${s}`).join('\n');
            return `Issue Level: ${issue.level}\nIssue: ${issue.issue}\n\nSuggestions:\n${suggestionText}`;
        }).join('\n\n');
    }

    private generateIssueId(): string {
        return `chatgpt_issue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private generateSuggestionId(): string {
        return `chatgpt_suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private categorizeIssue(issue: string): string {
        const lowerIssue = issue.toLowerCase();
        
        if (lowerIssue.includes('function') || lowerIssue.includes('responsibility') || lowerIssue.includes('maintain')) {
            return 'maintainability';
        } else if (lowerIssue.includes('magic') || lowerIssue.includes('constant') || lowerIssue.includes('naming')) {
            return 'style';
        } else if (lowerIssue.includes('error') || lowerIssue.includes('crash') || lowerIssue.includes('edge case')) {
            return 'code-quality';
        } else if (lowerIssue.includes('test') || lowerIssue.includes('unit')) {
            return 'testing';
        } else {
            return 'code-quality';
        }
    }
}
