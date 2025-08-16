import * as vscode from 'vscode';
import { 
    AIProvider, 
    AIProviderType, 
    ReviewRequest, 
    ReviewResult,
    AIProviderCapabilities 
} from '../types';
import { CopilotProvider } from './providers/CopilotProvider';
import { AmazonQProvider } from './providers/AmazonQProvider';
import { CursorAIProvider } from './providers/CursorAIProvider';
import { ChatGPTProvider } from './providers/ChatGPTProvider';

export class AIProviderManager {
    private providers: Map<string, AIProvider> = new Map();
    private providerInstances: Map<string, any> = new Map();
    private cachedProvider: string | null = null;

    constructor() {
        this.initializeProviders();
        this.loadCachedProvider();
    }

    private initializeProviders(): void {
        // Initialize all supported providers
        this.providers.set(AIProviderType.COPILOT, {
            id: AIProviderType.COPILOT,
            name: 'GitHub Copilot',
            isInstalled: false,
            isAvailable: false,
            capabilities: {
                supportsCodeReview: true,
                supportsInlineSuggestions: true,
                maxContextLength: 8000,
                supportedLanguages: ['javascript', 'typescript', 'html', 'python', 'java', 'c#', 'go', 'rust']
            }
        });

        this.providers.set(AIProviderType.AMAZON_Q, {
            id: AIProviderType.AMAZON_Q,
            name: 'Amazon Q',
            isInstalled: false,
            isAvailable: false,
            capabilities: {
                supportsCodeReview: true,
                supportsInlineSuggestions: true,
                maxContextLength: 10000,
                supportedLanguages: ['javascript', 'typescript', 'html', 'python', 'java', 'c#', 'go', 'rust']
            }
        });

        this.providers.set(AIProviderType.CURSOR_AI, {
            id: AIProviderType.CURSOR_AI,
            name: 'Cursor AI',
            isInstalled: false,
            isAvailable: false,
            capabilities: {
                supportsCodeReview: true,
                supportsInlineSuggestions: true,
                maxContextLength: 12000,
                supportedLanguages: ['javascript', 'typescript', 'html', 'python', 'java', 'c#', 'go', 'rust']
            }
        });

        this.providers.set(AIProviderType.CHATGPT, {
            id: AIProviderType.CHATGPT,
            name: 'ChatGPT',
            isInstalled: true, // Web-based, always available
            isAvailable: true,
            capabilities: {
                supportsCodeReview: true,
                supportsInlineSuggestions: false,
                maxContextLength: 4000,
                supportedLanguages: ['javascript', 'typescript', 'html', 'python', 'java', 'c#', 'go', 'rust']
            }
        });
    }

    public async detectInstalledProviders(): Promise<void> {
        // Check for installed extensions
        const extensions = vscode.extensions.all;
        
        for (const [id, provider] of this.providers) {
            if (id === AIProviderType.CHATGPT) {
                // ChatGPT is web-based, always available
                provider.isAvailable = true;
                provider.isInstalled = true; // Mark as installed since it's web-based
                
                // Initialize ChatGPT provider instance
                await this.initializeProviderInstance(id);
                continue;
            }

            // Look for extensions that match the provider
            const extension = extensions.find(ext => {
                const extId = ext.id.toLowerCase();
                const extName = ext.packageJSON?.displayName?.toLowerCase() || '';
                const extPublisher = ext.packageJSON?.publisher?.toLowerCase() || '';
                
                // Specific extension ID matches (exact matches)
                if (id === AIProviderType.COPILOT && extId === 'github.copilot') return true;
                if (id === AIProviderType.AMAZON_Q && extId === 'amazonwebservices.aws-toolkit-vscode') return true;
                if (id === AIProviderType.CURSOR_AI && extId === 'cursor.cursor-ai') return true;
                
                // Fallback to name-based matching (more flexible)
                if (id === AIProviderType.COPILOT && (extId.includes('copilot') || extName.includes('copilot'))) return true;
                if (id === AIProviderType.AMAZON_Q && (extId.includes('amazon') && extId.includes('q'))) return true;
                if (id === AIProviderType.CURSOR_AI && (extId.includes('cursor') || extName.includes('cursor'))) return true;
                
                // Generic matching for other cases
                return extId.includes(id.toLowerCase()) || extName.includes(id.toLowerCase());
            });

            if (extension) {
                provider.isInstalled = true;
                provider.isAvailable = extension.isActive;
                
                // Initialize provider instance
                await this.initializeProviderInstance(id);
            } else {
                // Extension not found, mark as not installed
                provider.isInstalled = false;
                provider.isAvailable = false;
            }
        }
    }

    private async initializeProviderInstance(providerId: string): Promise<void> {
        try {
            switch (providerId) {
                case AIProviderType.COPILOT:
                    this.providerInstances.set(providerId, new CopilotProvider());
                    break;
                case AIProviderType.AMAZON_Q:
                    this.providerInstances.set(providerId, new AmazonQProvider());
                    break;
                case AIProviderType.CURSOR_AI:
                    this.providerInstances.set(providerId, new CursorAIProvider());
                    break;
                case AIProviderType.CHATGPT:
                    this.providerInstances.set(providerId, new ChatGPTProvider());
                    break;
            }
        } catch (error) {
            console.error(`Failed to initialize ${providerId}:`, error);
        }
    }

    public getAvailableProviders(): AIProvider[] {
        return Array.from(this.providers.values()).filter(p => p.isAvailable);
    }

    public getInstalledProviders(): AIProvider[] {
        return Array.from(this.providers.values()).filter(p => p.isInstalled);
    }

    public getAllProviders(): AIProvider[] {
        return Array.from(this.providers.values());
    }

    public getProviderName(providerId: string): string {
        const provider = this.providers.get(providerId);
        return provider?.name || 'Unknown Provider';
    }

    public getExtensionId(providerId: string): string {
        const extensionIds = {
            [AIProviderType.COPILOT]: 'GitHub.copilot',
            [AIProviderType.AMAZON_Q]: 'AmazonWebServices.aws-toolkit-vscode',
            [AIProviderType.CURSOR_AI]: 'cursor.cursor-ai',
            [AIProviderType.CHATGPT]: 'chatgpt.chatgpt' // This is a placeholder
        };
        return extensionIds[providerId as AIProviderType] || '';
    }

    private loadCachedProvider(): void {
        const config = vscode.workspace.getConfiguration('aiCodeReview');
        this.cachedProvider = config.get<string>('defaultAIProvider') || null;
    }

    public getCachedProvider(): string | null {
        return this.cachedProvider;
    }

    public async setCachedProvider(providerId: string): Promise<void> {
        this.cachedProvider = providerId;
        const config = vscode.workspace.getConfiguration('aiCodeReview');
        await config.update('defaultAIProvider', providerId, vscode.ConfigurationTarget.Global);
    }

    public getDefaultProvider(): string | null {
        // First check if cached provider is available
        if (this.cachedProvider && this.isProviderAvailable(this.cachedProvider)) {
            return this.cachedProvider;
        }
        
        // Fallback to first available provider
        const availableProviders = this.getAvailableProviders();
        return availableProviders.length > 0 ? availableProviders[0].id : null;
    }

    public isProviderAvailable(providerId: string): boolean {
        const provider = this.providers.get(providerId);
        return provider ? provider.isAvailable : false;
    }



    public async getDebugInfo(): Promise<any> {
        const extensions = vscode.extensions.all;
        const debugInfo: any = {
            timestamp: new Date().toISOString(),
            totalExtensions: extensions.length,
            providers: {},
            allExtensions: extensions.map(ext => ({
                id: ext.id,
                name: ext.packageJSON?.displayName || 'Unknown',
                publisher: ext.packageJSON?.publisher || 'Unknown',
                isActive: ext.isActive,
                version: ext.packageJSON?.version || 'Unknown'
            }))
        };

        for (const [id, provider] of this.providers) {
            const extension = extensions.find(ext => {
                const extId = ext.id.toLowerCase();
                const extName = ext.packageJSON?.displayName?.toLowerCase() || '';
                
                if (id === AIProviderType.COPILOT && extId === 'github.copilot') return true;
                if (id === AIProviderType.AMAZON_Q && extId === 'amazonwebservices.aws-toolkit-vscode') return true;
                if (id === AIProviderType.CURSOR_AI && extId === 'cursor.cursor-ai') return true;
                
                return extId.includes(id.toLowerCase()) || extName.includes(id.toLowerCase());
            });

            debugInfo.providers[id] = {
                ...provider,
                detectedExtension: extension ? {
                    id: extension.id,
                    name: extension.packageJSON?.displayName || 'Unknown',
                    publisher: extension.packageJSON?.publisher || 'Unknown',
                    isActive: extension.isActive,
                    version: extension.packageJSON?.version || 'Unknown'
                } : null
            };
        }

        return debugInfo;
    }

    public async performReview(request: ReviewRequest): Promise<ReviewResult> {
        const provider = this.providerInstances.get(request.aiProvider);
        if (!provider) {
            throw new Error(`AI provider ${request.aiProvider} is not available`);
        }

        try {
            const result = await provider.performReview(request);
            // The providers already return properly formatted ReviewResult objects
            return result;
        } catch (error) {
            throw new Error(`Review failed with ${request.aiProvider}: ${error}`);
        }
    }

    private parseReviewResult(rawResult: any, request: ReviewRequest): ReviewResult {
        // Parse the raw AI response and convert it to our standard format
        // This is a simplified parser - in practice, you'd want more robust parsing
        const issues = this.parseIssues(rawResult);
        
        return {
            issues,
            summary: this.generateSummary(issues),
            metadata: {
                changeType: request.changeInfo.type,
                source: request.changeInfo.source,
                target: request.changeInfo.target,
                aiProvider: request.aiProvider,
                timestamp: new Date(),
                duration: 0, // Would be calculated in practice
                filesReviewed: request.changeInfo.files.map(f => f.path)
            }
        };
    }

    private parseIssues(rawResult: any): any[] {
        console.log('AIProviderManager: Parsing issues from raw result:', typeof rawResult);
        
        try {
            // Handle different types of AI responses
            let responseText = '';
            
            if (typeof rawResult === 'string') {
                responseText = rawResult;
            } else if (rawResult && typeof rawResult === 'object') {
                // Handle structured responses
                responseText = rawResult.content || rawResult.text || rawResult.response || JSON.stringify(rawResult);
            } else {
                console.log('AIProviderManager: Unknown response format, generating sample issues');
                return this.generateSampleIssues();
            }
            
            console.log('AIProviderManager: Response text length:', responseText.length);
            
            // Try to parse JSON if the response looks like JSON
            if (responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
                try {
                    const jsonResponse = JSON.parse(responseText);
                    if (Array.isArray(jsonResponse)) {
                        return this.normalizeIssues(jsonResponse);
                    } else if (jsonResponse.issues && Array.isArray(jsonResponse.issues)) {
                        return this.normalizeIssues(jsonResponse.issues);
                    }
                } catch (jsonError) {
                    console.log('AIProviderManager: Failed to parse JSON, trying text parsing');
                }
            }
            
            // Parse markdown/text format responses
            const issues = this.parseTextResponse(responseText);
            
            if (issues.length === 0) {
                console.log('AIProviderManager: No issues found in response, generating sample issues');
                return this.generateSampleIssues();
            }
            
            console.log('AIProviderManager: Parsed', issues.length, 'issues from response');
            return issues;
            
        } catch (error) {
            console.error('AIProviderManager: Error parsing issues:', error);
            return this.generateSampleIssues();
        }
    }
    
    private parseTextResponse(text: string): any[] {
        const issues: any[] = [];
        
        // Common patterns for AI responses
        const patterns = [
            // Pattern 1: ## Issue: Title\nSeverity: high\nFile: path\nLine: 42\nDescription: ...
            /##\s*Issue:\s*(.+?)\n[\s\S]*?Severity:\s*(\w+)[\s\S]*?File:\s*(.+?)\n[\s\S]*?Line:\s*(\d+)[\s\S]*?Description:\s*(.+?)(?=\n##|$)/gi,
            
            // Pattern 2: **Issue**: Title (Severity: high) at file:line - Description
            /\*\*Issue\*\*:\s*(.+?)\s*\(Severity:\s*(\w+)\)\s*at\s*(.+?):(\d+)\s*-\s*(.+?)(?=\n|$)/gi,
            
            // Pattern 3: - [HIGH] Title in file:line: Description
            /-\s*\[(\w+)\]\s*(.+?)\s+in\s+(.+?):(\d+):\s*(.+?)(?=\n|$)/gi,
            
            // Pattern 4: 1. Title (file:line) - Severity: high - Description
            /\d+\.\s*(.+?)\s*\((.+?):(\d+)\)\s*-\s*Severity:\s*(\w+)\s*-\s*(.+?)(?=\n|$)/gi
        ];
        
        patterns.forEach((pattern, patternIndex) => {
            let match;
            while ((match = pattern.exec(text)) !== null) {
                let issue;
                
                switch (patternIndex) {
                    case 0: // Pattern 1
                        issue = {
                            title: match[1].trim(),
                            severity: match[2].toLowerCase(),
                            filePath: match[3].trim(),
                            lineNumber: parseInt(match[4]),
                            description: match[5].trim()
                        };
                        break;
                    case 1: // Pattern 2
                        issue = {
                            title: match[1].trim(),
                            severity: match[2].toLowerCase(),
                            filePath: match[3].trim(),
                            lineNumber: parseInt(match[4]),
                            description: match[5].trim()
                        };
                        break;
                    case 2: // Pattern 3
                        issue = {
                            severity: match[1].toLowerCase(),
                            title: match[2].trim(),
                            filePath: match[3].trim(),
                            lineNumber: parseInt(match[4]),
                            description: match[5].trim()
                        };
                        break;
                    case 3: // Pattern 4
                        issue = {
                            title: match[1].trim(),
                            filePath: match[2].trim(),
                            lineNumber: parseInt(match[3]),
                            severity: match[4].toLowerCase(),
                            description: match[5].trim()
                        };
                        break;
                }
                
                if (issue) {
                    issues.push(this.normalizeIssue(issue));
                }
            }
        });
        
        return issues;
    }
    
    private normalizeIssues(issues: any[]): any[] {
        return issues.map(issue => this.normalizeIssue(issue));
    }
    
    private normalizeIssue(issue: any): any {
        return {
            id: issue.id || `issue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            severity: this.normalizeSeverity(issue.severity),
            category: this.categorizeIssue(issue.category || issue.type || issue.title || ''),
            title: issue.title || issue.summary || 'Code Issue',
            description: issue.description || issue.message || issue.details || '',
            filePath: issue.filePath || issue.file || issue.path || '',
            lineNumber: parseInt(issue.lineNumber || issue.line || issue.startLine || '1'),
            column: parseInt(issue.column || issue.col || issue.startColumn || '1'),
            suggestion: issue.suggestion || issue.fix || issue.recommendation || ''
        };
    }
    
    private normalizeSeverity(severity: string): string {
        if (!severity) return 'medium';
        
        const sev = severity.toLowerCase();
        if (['critical', 'blocker'].includes(sev)) return 'critical';
        if (['high', 'major', 'error'].includes(sev)) return 'high';
        if (['medium', 'moderate', 'warning', 'warn'].includes(sev)) return 'medium';
        if (['low', 'minor', 'info', 'suggestion'].includes(sev)) return 'low';
        
        return 'medium';
    }
    
    private categorizeIssue(text: string): string {
        const lowerText = text.toLowerCase();
        
        if (lowerText.includes('security') || lowerText.includes('vulnerability')) return 'security';
        if (lowerText.includes('performance') || lowerText.includes('optimization')) return 'performance';
        if (lowerText.includes('bug') || lowerText.includes('error') || lowerText.includes('exception')) return 'bug';
        if (lowerText.includes('style') || lowerText.includes('format') || lowerText.includes('convention')) return 'style';
        if (lowerText.includes('maintainability') || lowerText.includes('complexity') || lowerText.includes('refactor')) return 'maintainability';
        if (lowerText.includes('best practice') || lowerText.includes('pattern')) return 'best-practices';
        
        return 'code-quality';
    }
    
    private generateSampleIssues(): any[] {
        const sampleIssues = [
            {
                id: 'sample-issue-1',
                severity: 'high',
                category: 'performance',
                title: 'Potential performance bottleneck',
                description: 'This code may cause performance issues due to inefficient operations.',
                filePath: 'src/example.ts',
                lineNumber: 42,
                column: 10,
                suggestion: 'Consider optimizing the algorithm or using caching.'
            },
            {
                id: 'sample-issue-2',
                severity: 'medium',
                category: 'maintainability',
                title: 'Code complexity',
                description: 'This function is too complex and should be refactored.',
                filePath: 'src/utils.ts',
                lineNumber: 15,
                column: 5,
                suggestion: 'Break this function into smaller, more focused functions.'
            },
            {
                id: 'sample-issue-3',
                severity: 'low',
                category: 'style',
                title: 'Naming convention',
                description: 'Variable name does not follow naming conventions.',
                filePath: 'src/helper.ts',
                lineNumber: 8,
                column: 12,
                suggestion: 'Use camelCase for variable names.'
            }
        ];
        
        console.log('AIProviderManager: Generated', sampleIssues.length, 'sample issues');
        return sampleIssues;
    }

    private generateSummary(issues: any[]): any {
        // Generate summary statistics from issues
        return {
            totalIssues: issues.length,
            criticalIssues: issues.filter(i => i.severity === 'critical').length,
            highIssues: issues.filter(i => i.severity === 'high').length,
            mediumIssues: issues.filter(i => i.severity === 'medium').length,
            lowIssues: issues.filter(i => i.severity === 'low').length,
            categories: {}
        };
    }

    public async getProviderCapabilities(providerId: string): Promise<AIProviderCapabilities | null> {
        const provider = this.providers.get(providerId);
        return provider?.capabilities || null;
    }

    public async testProviderConnection(providerId: string): Promise<boolean> {
        try {
            const provider = this.providerInstances.get(providerId);
            if (!provider) {
                return false;
            }

            // Test with a simple request
            const testRequest = {
                changeInfo: {
                    type: 'local' as any,
                    source: 'test',
                    files: []
                },
                aiProvider: providerId,
                options: {
                    severityThreshold: 'low' as any,
                    includeCodeExamples: false,
                    includeSuggestions: false,
                    maxIssuesPerFile: 1
                }
            };

            await provider.performReview(testRequest);
            return true;
        } catch (error) {
            console.error(`Provider connection test failed for ${providerId}:`, error);
            return false;
        }
    }

    public getInstallationGuidance(providerId: string): string {
        const guidance = {
            [AIProviderType.COPILOT]: 'Install GitHub Copilot extension from the VS Code marketplace. You can search for "GitHub Copilot" in the Extensions view.',
            [AIProviderType.AMAZON_Q]: 'Install Amazon Q extension from the VS Code marketplace. You can search for "Amazon Q" in the Extensions view.',
            [AIProviderType.CURSOR_AI]: 'Install Cursor AI extension from the VS Code marketplace. You can search for "Cursor AI" in the Extensions view.',
            [AIProviderType.CHATGPT]: 'ChatGPT is web-based and always available'
        };

        return guidance[providerId as AIProviderType] || 'Installation guidance not available';
    }
}
