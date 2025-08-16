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

    constructor() {
        this.initializeProviders();
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
        // This is a placeholder implementation
        // In practice, you'd parse the AI response based on the template format
        return [];
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
