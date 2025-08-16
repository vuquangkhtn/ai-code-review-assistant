export interface CodeIssue {
    id: string;
    severity: IssueSeverity;
    category: IssueCategory;
    title: string;
    description: string;
    suggestions: CodeSuggestion[];
    filePath: string;
    lineNumber: number;
    columnNumber?: number;
    codeSnippet?: string;
    timestamp: Date;
}

export interface CodeSuggestion {
    id: string;
    description: string;
    codeExample?: string;
    explanation: string;
}

export interface ReviewResult {
    issues: CodeIssue[];
    summary: ReviewSummary;
    metadata: ReviewMetadata;
}

export interface ReviewSummary {
    totalIssues: number;
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
    categories: Record<IssueCategory, number>;
}

export interface ReviewMetadata {
    changeType: ChangeType;
    source: string;
    target?: string;
    aiProvider: string;
    timestamp: Date;
    duration: number;
    filesReviewed: string[];
}

export interface ChangeInfo {
    type: ChangeType;
    source: string;
    target?: string;
    files: ChangedFile[];
}

export interface ChangedFile {
    path: string;
    status: 'modified' | 'added' | 'deleted' | 'renamed';
    additions?: number;
    deletions?: number;
    diff?: string;
}

export interface AIProvider {
    id: string;
    name: string;
    isInstalled: boolean;
    isAvailable: boolean;
    capabilities: AIProviderCapabilities;
}

export interface AIProviderCapabilities {
    supportsCodeReview: boolean;
    supportsInlineSuggestions: boolean;
    maxContextLength: number;
    supportedLanguages: string[];
}

export interface ReviewRequest {
    changeInfo: ChangeInfo;
    aiProvider: string;
    options: ReviewOptions;
}

export interface ReviewOptions {
    severityThreshold: IssueSeverity;
    includeCodeExamples: boolean;
    includeSuggestions: boolean;
    maxIssuesPerFile: number;
    focusCategories?: IssueCategory[];
}

export interface UserPreferences {
    defaultChangeType: ChangeType;
    defaultAIProvider: string;
    severityThreshold: IssueSeverity;
    supportedLanguages: string[];
    autoCache: boolean;
    reviewTemplate: string;
}

export enum IssueSeverity {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical'
}

export enum IssueCategory {
    SECURITY = 'security',
    PERFORMANCE = 'performance',
    CODE_QUALITY = 'code-quality',
    BEST_PRACTICES = 'best-practices',
    STYLE = 'style',
    MAINTAINABILITY = 'maintainability',
    TESTING = 'testing',
    DOCUMENTATION = 'documentation',
    OTHER = 'other'
}

export enum ChangeType {
    LOCAL = 'local',
    COMMIT = 'commit',
    BRANCH = 'branch',
    ALL_FILES = 'all-files'
}

export enum AIProviderType {
    COPILOT = 'copilot',
    AMAZON_Q = 'amazon-q',
    CURSOR_AI = 'cursor-ai',
    CHATGPT = 'chatgpt'
}
