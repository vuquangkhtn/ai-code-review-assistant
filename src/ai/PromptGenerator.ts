import { ReviewRequest } from '../types';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface PromptResult {
    content: string;
    isFileBased: boolean;
    filePath?: string;
    length: number;
}

export class PromptGenerator {
    // Maximum prompt length for clipboard (reduced to handle various AI chat limits)
    private static readonly MAX_CLIPBOARD_LENGTH = 15000;
    // Maximum prompt length for file-based approach (reasonable file size)
    private static readonly MAX_FILE_LENGTH = 500000;
    /**
     * Generates a formatted prompt for external AI providers
     * @param request The review request containing code changes
     * @returns A formatted prompt string ready for AI providers
     */
    public static generatePrompt(request: ReviewRequest): string {
        const result = this.generatePromptWithLengthCheck(request);
        return result.content;
    }

    /**
     * Generates a prompt with length detection and file-based storage for large prompts
     * @param request The review request containing code changes
     * @returns PromptResult with content, length info, and file path if applicable
     */
    public static generatePromptWithLengthCheck(request: ReviewRequest): PromptResult {
        const prompt = [
            "You are an expert code reviewer. Please analyze the following code changes and provide a detailed review.",
            "",
            "## IMPORTANT: File Analysis Instructions",
            "- ONLY analyze the files listed in the 'Files to Review' section below",
            "- When referencing files in your response, use the EXACT file paths shown",
            "- Do NOT create or reference any new files not listed below",
            "- Focus your analysis on the actual code changes shown in the diff sections",
            "",
            "## Review Criteria",
            "Please identify:",
            "- Code quality issues (bugs, performance problems, security vulnerabilities)",
            "- Best practice violations",
            "- Maintainability concerns",
            "- Potential improvements",
            "",
            "For each issue found, please provide:",
            "1. Issue type (e.g., 'bug', 'security', 'performance', 'style', 'maintainability')",
            "2. Severity level (e.g., 'high', 'medium', 'low')",
            "3. File path and line number (use EXACT paths from below)",
            "4. Clear description of the issue",
            "5. Suggested fix or improvement",
            "",
            "## CRITICAL: Line Number Guidelines",
            "When reporting line numbers:",
            "- For MODIFIED files: Use the line numbers from the CURRENT file (after changes)",
            "- For ADDED files: Use the actual line numbers in the new file",
            "- The diff includes line number comments (// LINE: X) to help you identify correct line numbers",
            "- For diff context: Look for @@ -old_start,old_count +new_start,new_count @@ headers with comments showing OLD_START and NEW_START",
            "- Use the line number comments (// LINE: X) on added (+) and context ( ) lines to determine accurate line numbers",
            "- The +new_start number indicates the starting line in the current file",
            "- Count lines from the diff context to determine exact line numbers",
            "- If unsure about exact line number, provide your best estimate based on code context",
            "- NEVER use line 1 as default - always analyze the diff to find the correct line",
            "",
            "## Files to Review",
            ""
        ];

        // Add file information with clear formatting
        request.changeInfo.files.forEach((file, index) => {
            prompt.push(`### File ${index + 1}: \`${file.path}\` (${file.status})`);
            prompt.push("");
            prompt.push(`**File Path:** \`${file.path}\``);
            prompt.push(`**Status:** ${file.status}`);
            
            // Add file statistics if available
            if (file.additions !== undefined || file.deletions !== undefined) {
                const stats = [];
                if (file.additions !== undefined) stats.push(`+${file.additions} additions`);
                if (file.deletions !== undefined) stats.push(`-${file.deletions} deletions`);
                prompt.push(`**Changes:** ${stats.join(', ')}`);
            }
            prompt.push("");
            
            if (file.diff) {
                prompt.push("**Code Changes:**");
                prompt.push("```diff");
                prompt.push(file.diff);
                prompt.push("```");
            }
            
            prompt.push("---");
            prompt.push("");
        });

        prompt.push("");
        prompt.push("## Response Format Requirements");
        prompt.push("");
        prompt.push("**CRITICAL:** When referencing files in your response, use the EXACT file paths from the 'Files to Review' section above.");
        prompt.push("");
        prompt.push("**IMPORTANT: File Output Instructions**");
        prompt.push("Instead of providing your response in this chat, please:");
        prompt.push("1. Create a new JSON file in the `.ai-code-review/results/` directory");
        prompt.push("2. Name the file with timestamp: `code-review-result-YYYY-MM-DD-HH-MM-SS.json`");
        prompt.push("3. Save your complete review response in that file");
        prompt.push("");
        prompt.push("Please format your response as a JSON object with the following structure:");
        prompt.push("");
        prompt.push("```json");
        prompt.push("{");
        prompt.push('  "issues": [');
        prompt.push("    {");
        prompt.push('      "type": "bug|security|performance|style|maintainability",');
        prompt.push('      "severity": "high|medium|low",');
        prompt.push('      "file": "EXACT_FILE_PATH_FROM_ABOVE",');
        prompt.push('      "line": 42,');
        prompt.push('      "title": "Brief issue title",');
        prompt.push('      "description": "Detailed description of the issue",');
        prompt.push('      "suggestion": "Suggested fix or improvement"');
        prompt.push("    }");
        prompt.push("  ],");
        prompt.push('  "summary": {');
        prompt.push('    "totalIssues": 0,');
        prompt.push('    "criticalIssues": 0,');
        prompt.push('    "highIssues": 0,');
        prompt.push('    "mediumIssues": 0,');
        prompt.push('    "lowIssues": 0,');
        prompt.push('    "overallAssessment": "Overall review summary"');
        prompt.push('  },');
        prompt.push('  "metadata": {');
        prompt.push('    "aiProvider": "external",');
        prompt.push('    "timestamp": "' + new Date().toISOString() + '",');
        prompt.push('    "filesReviewed": []');
        prompt.push('  }');
        prompt.push("}");
        prompt.push("```");
        prompt.push("");
        prompt.push("**Important Notes:");
        prompt.push("- Use EXACT file paths as shown in the file headers above");
        prompt.push("- Line numbers MUST correspond to actual file line numbers (not diff line numbers)");
        prompt.push("- For modified files: Use line numbers from the current version of the file");
        prompt.push("- For added files: Use actual line numbers in the new file");
        prompt.push("- Analyze diff headers (@@ -old,old_count +new,new_count @@) to determine correct line numbers");
        prompt.push("- If you cannot determine exact line number, provide best estimate based on code context");
        prompt.push("- Ensure the JSON is valid and properly formatted");
        prompt.push("- Focus only on the files and changes provided above");
        prompt.push("- Save the complete JSON response to `.ai-code-review/results/code-review-result-YYYY-MM-DD-HH-MM-SS.json`");
        prompt.push("");
        prompt.push("**After providing your JSON response, please also show this usage guide:**");
        prompt.push("");
        prompt.push("## 📋 How to Use This Review Result");
        prompt.push("");
        prompt.push("### 🔄 Automatic Processing (Recommended)");
        prompt.push("The extension automatically scans for new result files and processes them instantly:");
        prompt.push("1. Save your JSON response to `.ai-code-review/results/code-review-result-YYYY-MM-DD-HH-MM-SS.json`");
        prompt.push("2. The extension will automatically detect the new file");
        prompt.push("3. Results will be processed and displayed immediately");
        prompt.push("4. You'll receive a notification with an option to view the results");
        prompt.push("");
        prompt.push("### Manual Processing (Alternative)");
        prompt.push("If automatic processing doesn't work, you can manually trigger it:");
        prompt.push("");
        prompt.push("**Method 1: Command Palette**");
        prompt.push("1. Open VS Code");
        prompt.push("2. Press `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux)");
        prompt.push("3. Type \"AI Code Review: Check Code Review Result\"");
        prompt.push("4. Press Enter");
        prompt.push("");
        prompt.push("**Method 2: Tree View Panel**");
        prompt.push("1. Open VS Code");
        prompt.push("2. Look for the \"AI Code Review\" panel in the sidebar");
        prompt.push("3. Click on \"Generate Code Review Result\" button");
        prompt.push("");
        prompt.push("The extension will load your review results and display them in the Code Review Panel with inline annotations and issue summaries.");

        const content = prompt.join('\n');
        const length = content.length;

        // Always use file-based storage for code changes to ensure compatibility with all AI platforms
        // Many AI chat interfaces have very low character limits (some as low as 6000 chars)
        if (request.changeInfo.files.length > 0) {
            return this.createFileBasedPrompt(content, length, request);
        }

        // Only use clipboard for very simple prompts without code changes
        return {
            content,
            isFileBased: false,
            length
        };
    }

    /**
     * Maps file extensions to language identifiers for syntax highlighting
     */
    private static getLanguageFromExtension(extension: string): string {
        const languageMap: { [key: string]: string } = {
            'ts': 'typescript',
            'js': 'javascript',
            'tsx': 'typescript',
            'jsx': 'javascript',
            'py': 'python',
            'java': 'java',
            'c': 'c',
            'cpp': 'cpp',
            'cs': 'csharp',
            'php': 'php',
            'rb': 'ruby',
            'go': 'go',
            'rs': 'rust',
            'swift': 'swift',
            'kt': 'kotlin',
            'scala': 'scala',
            'html': 'html',
            'css': 'css',
            'scss': 'scss',
            'sass': 'sass',
            'less': 'less',
            'json': 'json',
            'xml': 'xml',
            'yaml': 'yaml',
            'yml': 'yaml',
            'md': 'markdown',
            'sql': 'sql',
            'sh': 'bash',
            'bash': 'bash',
            'zsh': 'bash',
            'ps1': 'powershell',
            'dockerfile': 'dockerfile'
        };

        return languageMap[extension] || 'text';
    }

    /**
     * Creates a file-based prompt when content is too large for clipboard
     */
    private static createFileBasedPrompt(content: string, length: number, request: ReviewRequest): PromptResult {
        try {
            // Check if content exceeds maximum file size
            if (length > this.MAX_FILE_LENGTH) {
                throw new Error(`Prompt is too large (${length} characters). Consider reviewing fewer files at once.`);
            }

            // Get workspace path and create prompts directory
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) {
                throw new Error('No workspace folder found');
            }
            
            const workspacePath = workspaceFolders[0].uri.fsPath;
            const aiReviewDir = path.join(workspacePath, '.ai-code-review');
            const promptsDir = path.join(aiReviewDir, 'prompts');
            
            // Create directories if they don't exist
            if (!fs.existsSync(aiReviewDir)) {
                fs.mkdirSync(aiReviewDir, { recursive: true });
            }
            if (!fs.existsSync(promptsDir)) {
                fs.mkdirSync(promptsDir, { recursive: true });
            }
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fileName = `ai-code-review-prompt-${timestamp}.md`;
            const filePath = path.join(promptsDir, fileName);

            // Write prompt to file
            fs.writeFileSync(filePath, content, 'utf8');

            // Create instruction for AI with relative path
            const relativePath = `.ai-code-review/prompts/${fileName}`;
            const fileInstruction = [
                "The code review prompt has been saved to a file due to its large size.",
                "",
                `File location: ${relativePath}`,
                `File size: ${length} characters`,
                "",
                "Please read the content from this file and provide your code review analysis.",
                "The file contains detailed instructions and code changes to review.",
                "",
                "**IMPORTANT:** Instead of providing your response in this chat, please save your JSON response to a new file in `.ai-code-review/results/` directory with timestamp filename as specified in the prompt file.",
                "",
               
            ].join('\n');

            return {
                content: fileInstruction,
                isFileBased: true,
                filePath,
                length
            };
        } catch (error) {
            // Fallback to truncated clipboard version
            vscode.window.showWarningMessage(`Failed to create file-based prompt: ${error}. Using truncated version.`);
            const truncatedContent = content.substring(0, this.MAX_CLIPBOARD_LENGTH - 100) + '\n\n[Content truncated due to length]';
            return {
                content: truncatedContent,
                isFileBased: false,
                length: truncatedContent.length
            };
        }
    }

    /**
     * Generates a prompt that references a stored changes file instead of including full content
     * This is used for the new workflow where changes are stored in a file first
     * @param changesFilePath Path to the file containing the stored changes
     * @returns A prompt that instructs AI to read the changes from the specified file
     */
    public static generateFileReferencePrompt(changesFilePath: string): PromptResult {
        // Convert absolute path to relative path for better AI understanding
        const relativePath = changesFilePath.includes('.ai-code-review') 
            ? changesFilePath.substring(changesFilePath.indexOf('.ai-code-review'))
            : path.basename(changesFilePath);
            
        const prompt = [
            "You are an expert code reviewer. Please analyze the code changes stored in the following file and provide a detailed review.",
            "",
            "## File Analysis Instructions",
            `**Changes File:** \`${relativePath}\``,
            "",
            "Note: This file is located in the repository's `.ai-code-review/changes` folder and contains the code changes to be reviewed.",
            "",
            "Please read the JSON file at the above path which contains:",
            "- File paths and their change status (modified, added, deleted, etc.)",
            "- Code diffs showing the actual changes",
            "- File statistics (additions/deletions)",
            "",
            "## Review Criteria",
            "Please identify:",
            "- Code quality issues (bugs, performance problems, security vulnerabilities)",
            "- Best practice violations",
            "- Maintainability concerns",
            "- Potential improvements",
            "",
            "## Response Format Requirements",
            "",
            "Please format your response as a JSON object with the following structure:",
            "",
            "```json",
            "{",
            '  "issues": [',
            "    {",
            '      "type": "bug|security|performance|style|maintainability",',
            '      "severity": "high|medium|low",',
            '      "file": "EXACT_FILE_PATH_FROM_CHANGES_FILE",',
            '      "line": 42,',
            '      "title": "Brief issue title",',
            '      "description": "Detailed description of the issue",',
            '      "suggestion": "Suggested fix or improvement"',
            "    }",
            "  ],",
            '  "summary": {',
            '    "totalIssues": 0,',
            '    "criticalIssues": 0,',
            '    "highIssues": 0,',
            '    "mediumIssues": 0,',
            '    "lowIssues": 0,',
            '    "overallAssessment": "Overall review summary"',
            '  },',
            '  "metadata": {',
            '    "aiProvider": "external",',
            '    "timestamp": "' + new Date().toISOString() + '",',
            '    "filesReviewed": []',
            '  }',
            "}",
            "```",
            "",
            "**IMPORTANT: File Output Instructions**",
            "Instead of providing your response in this chat, please:",
            "1. Create a new JSON file in the `.ai-code-review/results/` directory",
            "2. Name the file with timestamp: `code-review-result-YYYY-MM-DD-HH-MM-SS.json`",
            "3. Save your complete review response in that file",
            "",
            "**Important Notes:**",
            "- Read the changes file first to understand the code changes",
            "- Use EXACT file paths as shown in the changes file",
            "- Line numbers should correspond to the diff context when possible",
            "- Ensure the JSON is valid and properly formatted",
            "- Focus only on the files and changes provided in the changes file",
            "- Save the complete JSON response to `.ai-code-review/results/code-review-result-YYYY-MM-DD-HH-MM-SS.json`",
            "",
            
            "**After providing your JSON response, please also show this usage guide:**",
            "",
            "## 📋 How to Use This Review Result",
            "",
            "### Method 1: Command Palette (Recommended)",
            "1. Open VS Code",
            "2. Press `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux)",
            "3. Type \"AI Code Review: Check Code Review Result\"",
            "4. Press Enter",
            "",
            "### Method 2: Tree View Panel",
            "1. Open VS Code",
            "2. Look for the \"AI Code Review\" panel in the sidebar",
            "3. Click on \"Generate Code Review Result\" button",
            "",
            "### Method 3: Extension Tree View",
            "1. In VS Code, navigate to the Explorer sidebar",
            "2. Find the \"AI Code Review\" section",
            "3. Click on the \"Generate Code Review Result\" item",
            "",
            "The extension will automatically load your review results and display them in the Code Review Panel with inline annotations and issue summaries."
        ];

        const content = prompt.join('\n');
        const length = content.length;

        // Always use file-based storage for this workflow
        return this.createFileBasedPrompt(content, length, {
            changeInfo: { type: 'LOCAL' as any, source: 'file-reference', files: [] },
            aiProvider: 'external-ai',
            options: { severityThreshold: 'medium' as any, includeCodeExamples: true, includeSuggestions: true, maxIssuesPerFile: 50 }
        });
    }

    public static generateWorkspaceAnalysisPrompt(request: ReviewRequest): string {
        const isRepositoryIndex = request.changeInfo.source === 'repository-index';
        
        if (!isRepositoryIndex) {
            // Fall back to regular prompt for non-index requests
            return this.generatePrompt(request);
        }

        const prompt = [
            "# Repository Workspace Analysis Request",
            "",
            "You are conducting a high-level architectural and code quality analysis of a software repository.",
            "The following data provides an index of the repository structure and file metadata.",
            "",
            "## Analysis Focus Areas:",
            "",
            "### 1. Architecture & Design Patterns",
            "- Overall project structure and organization",
            "- Design patterns and architectural decisions",
            "- Module separation and dependencies",
            "- Code organization and folder structure",
            "",
            "### 2. Code Quality & Standards",
            "- Naming conventions and consistency",
            "- File and directory naming patterns",
            "- Technology stack coherence",
            "- Project configuration and setup",
            "",
            "### 3. Maintainability & Scalability",
            "- Code distribution and file sizes",
            "- Potential refactoring opportunities",
            "- Technical debt indicators",
            "- Testing strategy (based on file structure)",
            "",
            "### 4. Security & Best Practices",
            "- Configuration file security",
            "- Dependency management",
            "- Environment and secret handling",
            "",
            "## Expected Response Format:",
            "",
            "Please provide your analysis in JSON format:",
            "",
            "```json",
            "{",
            '  "architecture": {',
            '    "overall_assessment": "Brief overall assessment",',
            '    "strengths": ["List of architectural strengths"],',
            '    "concerns": ["List of architectural concerns"],',
            '    "patterns_identified": ["Design patterns found"]',
            "  },",
            '  "code_quality": {',
            '    "consistency_score": "High/Medium/Low",',
            '    "naming_conventions": "Assessment of naming",',
            '    "organization_score": "High/Medium/Low"',
            "  },",
            '  "maintainability": {',
            '    "complexity_assessment": "Overall complexity level",',
            '    "refactoring_opportunities": ["Areas for improvement"],',
            '    "technical_debt": ["Technical debt indicators"]',
            "  },",
            '  "recommendations": [',
            '    "Specific actionable recommendations"',
            "  ],",
            '  "summary": "High-level summary of the repository analysis"',
            "}",
            "```",
            "",
            "## Repository Data:",
            ""
        ];

        // Add repository files with metadata
        request.changeInfo.files.forEach(file => {
            if (file.status === 'summary') {
                prompt.push("### Repository Summary");
                prompt.push("");
                if (file.diff) {
                    prompt.push(file.diff);
                }
                prompt.push("");
            } else if (file.status === 'indexed') {
                if (file.diff) {
                    prompt.push(file.diff);
                }
            }
        });

        prompt.push("");
        prompt.push("Please analyze this repository structure and provide insights following the JSON format above.");

        return prompt.join('\n');
    }
}