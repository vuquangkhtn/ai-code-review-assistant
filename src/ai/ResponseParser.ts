import { ReviewResult, CodeIssue, ReviewSummary, ReviewMetadata, IssueSeverity, IssueCategory, ChangeType } from '../types';
import { v4 as uuidv4 } from 'uuid';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export interface ExternalAIResponse {
    issues: {
        type: string;
        severity: string;
        file: string;
        line?: number;
        title: string;
        description: string;
        suggestion: string;
    }[];
    summary?: string;
}

export class ResponseParser {
    /**
     * Parses AI response from external providers and converts to ReviewResult
     * @param responseText The raw response text from AI provider
     * @param aiProvider The name of the AI provider
     * @param filesReviewed List of files that were reviewed
     * @returns Parsed ReviewResult or null if parsing fails
     */
    public static parseResponse(
        responseText: string,
        aiProvider: string,
        filesReviewed: string[]
    ): ReviewResult | null {
        try {
            // Try to extract JSON from the response
            const jsonResponse = this.extractJSON(responseText);
            if (!jsonResponse) {
                return this.parseTextResponse(responseText, aiProvider, filesReviewed);
            }

            return this.parseJSONResponse(jsonResponse, aiProvider, filesReviewed);
        } catch (error) {
            console.error('Failed to parse AI response:', error);
            return null;
        }
    }

    /**
     * Extracts JSON from response text that might contain additional text
     */
    private static extractJSON(text: string): ExternalAIResponse | null {
        try {
            // Try to parse the entire text as JSON first
            const parsed = JSON.parse(text);
            
            // Handle nested structure with 'review' wrapper
            if (parsed.review && parsed.review.issues) {
                return {
                    issues: parsed.review.issues,
                    summary: parsed.review.summary?.overall_quality || parsed.review.summary
                };
            }
            
            return parsed;
        } catch {
            // Look for JSON blocks in the text
            const jsonMatches = text.match(/```json\s*([\s\S]*?)\s*```/g) ||
                               text.match(/{[\s\S]*}/g);
            
            if (jsonMatches) {
                for (const match of jsonMatches) {
                    try {
                        const cleanMatch = match.replace(/```json\s*|\s*```/g, '').trim();
                        const parsed = JSON.parse(cleanMatch);
                        
                        // Handle nested structure with 'review' wrapper
                        if (parsed.review && parsed.review.issues) {
                            return {
                                issues: parsed.review.issues,
                                summary: parsed.review.summary?.overall_quality || parsed.review.summary
                            };
                        }
                        
                        return parsed;
                    } catch {
                        continue;
                    }
                }
            }
        }
        return null;
    }

    /**
     * Parses JSON response from AI provider
     */
    private static parseJSONResponse(
        response: ExternalAIResponse,
        aiProvider: string,
        filesReviewed: string[]
    ): ReviewResult {
        const issues: CodeIssue[] = [];
        
        if (response.issues && Array.isArray(response.issues)) {
            for (const issue of response.issues) {
                const codeIssue = this.convertToCodeIssue(issue);
                if (codeIssue) {
                    issues.push(codeIssue);
                }
            }
        }

        const summary = this.generateSummary(issues);
        const metadata = this.generateMetadata(aiProvider, filesReviewed);

        return {
            issues,
            summary,
            metadata
        };
    }

    /**
     * Parses text response when JSON parsing fails
     */
    private static parseTextResponse(
        responseText: string,
        aiProvider: string,
        filesReviewed: string[]
    ): ReviewResult {
        const issues: CodeIssue[] = [];
        const lines = responseText.split('\n');
        
        let currentIssue: Partial<CodeIssue> | null = null;
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            
            // Look for issue patterns
            if (this.isIssueStart(trimmedLine)) {
                if (currentIssue && currentIssue.title) {
                    const issue = this.finalizeTextIssue(currentIssue);
                    if (issue) issues.push(issue);
                }
                currentIssue = this.parseIssueStart(trimmedLine);
            } else if (currentIssue) {
                this.updateCurrentIssue(currentIssue, trimmedLine);
            }
        }
        
        // Add the last issue if exists
        if (currentIssue && currentIssue.title) {
            const issue = this.finalizeTextIssue(currentIssue);
            if (issue) issues.push(issue);
        }

        const summary = this.generateSummary(issues);
        const metadata = this.generateMetadata(aiProvider, filesReviewed);

        return {
            issues,
            summary,
            metadata
        };
    }

    /**
     * Converts external issue format to CodeIssue
     */
    private static convertToCodeIssue(issue: any): CodeIssue | null {
        try {
            const filePath = issue.file || 'unknown';
            
            // Filter out generated prompt files and non-code files
            if (!this.isValidSourceFile(filePath)) {
                return null;
            }
            
            // Validate and correct line number
            const validatedLineNumber = this.validateLineNumber(filePath, issue.line || 1);
            
            return {
                id: uuidv4(),
                severity: this.mapSeverity(issue.severity),
                category: this.mapCategory(issue.type),
                title: issue.title || 'Untitled Issue',
                description: issue.description || '',
                suggestions: issue.suggestion ? [{
                    id: uuidv4(),
                    description: issue.suggestion,
                    explanation: issue.suggestion
                }] : [],
                filePath: filePath,
                lineNumber: validatedLineNumber,
                timestamp: new Date()
            };
        } catch {
            return null;
        }
    }

    /**
     * Maps diff line numbers to actual file line numbers using diff context
     */
    private static mapDiffLineToActualLine(diffContent: string, diffLineNumber: number): number {
        const lines = diffContent.split('\n');
        let currentNewLine = 0;
        let diffLineCount = 0;
        
        for (const line of lines) {
            // Parse hunk headers to get starting line numbers
            const hunkMatch = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
            if (hunkMatch) {
                currentNewLine = parseInt(hunkMatch[1]);
                continue;
            }
            
            diffLineCount++;
            
            // If we've reached the target diff line
            if (diffLineCount === diffLineNumber) {
                if (line.startsWith('+') || line.startsWith(' ')) {
                    return currentNewLine;
                }
                // For deleted lines, return the previous line
                return Math.max(1, currentNewLine - 1);
            }
            
            // Update line counters
            if (line.startsWith('+') || line.startsWith(' ')) {
                currentNewLine++;
            }
        }
        
        return diffLineNumber; // Fallback to original if mapping fails
    }
    
    /**
     * Extracts line number from enhanced diff comments
     */
    private static extractLineFromDiffComment(diffLine: string): number | null {
        const lineMatch = diffLine.match(/\/\/ LINE: (\d+)/);
        if (lineMatch) {
            return parseInt(lineMatch[1]);
        }
        return null;
    }
    
    /**
     * Validates and corrects line numbers against actual file content
     */
    private static validateLineNumber(filePath: string, lineNumber: number): number {
        try {
            // Get workspace folder
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) {
                return lineNumber;
            }
            
            const workspacePath = workspaceFolders[0].uri.fsPath;
            const fullFilePath = path.resolve(workspacePath, filePath);
            
            // Check if file exists
            if (!fs.existsSync(fullFilePath)) {
                return lineNumber;
            }
            
            // Read file and count lines
            const fileContent = fs.readFileSync(fullFilePath, 'utf8');
            const totalLines = fileContent.split('\n').length;
            
            // If line number is valid, return it
            if (lineNumber >= 1 && lineNumber <= totalLines) {
                return lineNumber;
            }
            
            // If line number is too high, return the last line
            if (lineNumber > totalLines) {
                console.warn(`Line number ${lineNumber} exceeds file length ${totalLines} for ${filePath}. Using line ${totalLines}.`);
                return totalLines;
            }
            
            // If line number is less than 1, return 1
            if (lineNumber < 1) {
                console.warn(`Invalid line number ${lineNumber} for ${filePath}. Using line 1.`);
                return 1;
            }
            
            return lineNumber;
        } catch (error) {
            console.warn(`Failed to validate line number for ${filePath}:`, error);
            return lineNumber;
        }
    }
    
    /**
     * Validates if a file path refers to an actual source code file
     * Filters out generated prompt files and non-code files
     */
    private static isValidSourceFile(filePath: string): boolean {
        if (!filePath || filePath === 'unknown') {
            return false;
        }
        
        // Filter out generated prompt files
        const promptFilePatterns = [
            'WORKSPACE_ANALYSIS_PROMPT.md',
            'CODE_REVIEW_PROMPT.md',
            /\.prompt\.(md|txt)$/i,
            /^prompt_\d+\.(md|txt)$/i
        ];
        
        for (const pattern of promptFilePatterns) {
            if (pattern instanceof RegExp) {
                if (pattern.test(filePath)) {
                    return false;
                }
            } else if (filePath.includes(pattern)) {
                return false;
            }
        }
        
        // Only accept files with common source code extensions
        const sourceCodeExtensions = [
            '.ts', '.js', '.tsx', '.jsx', '.py', '.java', '.cpp', '.c', '.h',
            '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.scala',
            '.vue', '.svelte', '.html', '.css', '.scss', '.sass', '.less',
            '.json', '.xml', '.yaml', '.yml', '.toml', '.ini', '.cfg',
            '.sh', '.bash', '.zsh', '.fish', '.ps1', '.bat', '.cmd',
            '.sql', '.graphql', '.proto', '.thrift', '.dockerfile'
        ];
        
        const hasValidExtension = sourceCodeExtensions.some(ext => 
            filePath.toLowerCase().endsWith(ext)
        );
        
        // Also accept common config files without extensions
        const configFiles = [
            'Dockerfile', 'Makefile', 'Rakefile', 'Gemfile', 'Podfile',
            '.gitignore', '.dockerignore', '.eslintrc', '.prettierrc'
        ];
        
        const isConfigFile = configFiles.some(file => 
            filePath.endsWith(file)
        );
        
        return hasValidExtension || isConfigFile;
    }

    /**
     * Maps external severity to internal IssueSeverity
     */
    private static mapSeverity(severity: string): IssueSeverity {
        const severityMap: { [key: string]: IssueSeverity } = {
            'critical': IssueSeverity.CRITICAL,
            'high': IssueSeverity.HIGH,
            'medium': IssueSeverity.MEDIUM,
            'low': IssueSeverity.LOW
        };
        
        return severityMap[severity?.toLowerCase()] || IssueSeverity.MEDIUM;
    }

    /**
     * Maps external issue type to internal IssueCategory
     */
    private static mapCategory(type: string): IssueCategory {
        const categoryMap: { [key: string]: IssueCategory } = {
            'security': IssueCategory.SECURITY,
            'performance': IssueCategory.PERFORMANCE,
            'bug': IssueCategory.CODE_QUALITY,
            'style': IssueCategory.STYLE,
            'maintainability': IssueCategory.MAINTAINABILITY,
            'best-practices': IssueCategory.BEST_PRACTICES,
            'testing': IssueCategory.TESTING,
            'documentation': IssueCategory.DOCUMENTATION
        };
        
        return categoryMap[type?.toLowerCase()] || IssueCategory.OTHER;
    }

    /**
     * Checks if a line starts a new issue
     */
    private static isIssueStart(line: string): boolean {
        return /^(\d+\.|[-*]|#{1,3})\s/.test(line) ||
               /^(Issue|Problem|Warning|Error):/i.test(line) ||
               /^(HIGH|MEDIUM|LOW|CRITICAL):/i.test(line);
    }

    /**
     * Parses the start of an issue from text
     */
    private static parseIssueStart(line: string): Partial<CodeIssue> {
        const issue: Partial<CodeIssue> = {
            id: uuidv4(),
            timestamp: new Date()
        };
        
        // Extract severity if present
        const severityMatch = line.match(/(HIGH|MEDIUM|LOW|CRITICAL)/i);
        if (severityMatch) {
            issue.severity = this.mapSeverity(severityMatch[1]);
        }
        
        // Extract title
        const titleMatch = line.replace(/^(\d+\.|[-*]|#{1,3})\s/, '')
                              .replace(/(HIGH|MEDIUM|LOW|CRITICAL):/i, '')
                              .trim();
        issue.title = titleMatch || 'Untitled Issue';
        
        return issue;
    }

    /**
     * Updates current issue with additional information
     */
    private static updateCurrentIssue(issue: Partial<CodeIssue>, line: string): void {
        if (line.startsWith('File:') || line.includes('.')) {
            const fileMatch = line.match(/([^\s]+\.[^\s]+)/);
            if (fileMatch) {
                issue.filePath = fileMatch[1];
            }
        }
        
        if (line.startsWith('Line:') || /line\s*\d+/i.test(line)) {
            const lineMatch = line.match(/\d+/);
            if (lineMatch) {
                const rawLineNumber = parseInt(lineMatch[0]);
                issue.lineNumber = issue.filePath ? this.validateLineNumber(issue.filePath, rawLineNumber) : rawLineNumber;
            }
        }
        
        if (!issue.description && line.length > 10) {
            issue.description = (issue.description || '') + ' ' + line;
        }
    }

    /**
     * Finalizes a text-parsed issue
     */
    private static finalizeTextIssue(issue: Partial<CodeIssue>): CodeIssue | null {
        if (!issue.title) return null;
        
        return {
            id: issue.id || uuidv4(),
            severity: issue.severity || IssueSeverity.MEDIUM,
            category: IssueCategory.OTHER,
            title: issue.title,
            description: (issue.description || '').trim(),
            suggestions: [],
            filePath: issue.filePath || 'unknown',
            lineNumber: issue.lineNumber || 1,
            timestamp: issue.timestamp || new Date()
        };
    }

    /**
     * Generates summary from issues
     */
    private static generateSummary(issues: CodeIssue[]): ReviewSummary {
        const summary: ReviewSummary = {
            totalIssues: issues.length,
            criticalIssues: 0,
            highIssues: 0,
            mediumIssues: 0,
            lowIssues: 0,
            categories: {
                [IssueCategory.SECURITY]: 0,
                [IssueCategory.PERFORMANCE]: 0,
                [IssueCategory.CODE_QUALITY]: 0,
                [IssueCategory.BEST_PRACTICES]: 0,
                [IssueCategory.STYLE]: 0,
                [IssueCategory.MAINTAINABILITY]: 0,
                [IssueCategory.TESTING]: 0,
                [IssueCategory.DOCUMENTATION]: 0,
                [IssueCategory.OTHER]: 0
            }
        };

        for (const issue of issues) {
            // Count by severity
            switch (issue.severity) {
                case IssueSeverity.CRITICAL:
                    summary.criticalIssues++;
                    break;
                case IssueSeverity.HIGH:
                    summary.highIssues++;
                    break;
                case IssueSeverity.MEDIUM:
                    summary.mediumIssues++;
                    break;
                case IssueSeverity.LOW:
                    summary.lowIssues++;
                    break;
            }

            // Count by category
            summary.categories[issue.category]++;
        }

        return summary;
    }

    /**
     * Generates metadata for the review
     */
    private static generateMetadata(aiProvider: string, filesReviewed: string[]): ReviewMetadata {
        return {
            changeType: ChangeType.LOCAL,
            source: 'external-ai',
            aiProvider,
            timestamp: new Date(),
            duration: 0,
            filesReviewed
        };
    }
}