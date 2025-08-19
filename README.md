# 🤖 AI Code Review Assistant

*A powerful VS Code extension that automates code review using AI to provide senior-level feedback on your code changes*

This VS Code extension helps developers get comprehensive code reviews by generating structured prompts for AI tools and processing their responses. It provides detailed feedback on your code changes, helping you catch issues early and improve code quality through manual AI integration.

## ✨ Features

### 🔍 Multi-Format Code Change Analysis
- **Commit Changes**: Compare against specific commit hashes with smart defaults
- **Branch Changes**: Compare against any branch with easy branch selection
- **Local Changes**: Review uncommitted changes in real-time

### 🤖 AI-Powered Code Review
- **Manual AI Integration**: Generate prompts for use with your preferred AI provider
- **Structured Prompt Generation**: Creates comprehensive prompts with:
  - Code changes and context
  - Specific review guidelines
  - Expected response format
- **Flexible AI Support**: Works with any AI provider that accepts text prompts
- **Result Processing**: Parse and display AI responses in structured format
- **No API Keys Required**: Uses manual copy-paste workflow with AI tools

### 📋 Structured Review Output
- **Issue Classification**: Low/Medium/High/Critical severity levels
- **Detailed Feedback**: Comprehensive issue descriptions with actionable suggestions
- **Code Examples**: Practical code snippets demonstrating suggested improvements
- **Issue Categorization**: Tagged issues for better organization (performance, security, style, etc.)

### 🎯 Flexible Review Options
- **On-Demand Reviews**: Trigger reviews manually when you're ready
- **Real-Time Processing**: Get instant feedback as you code
- **Batch Processing**: Review multiple files simultaneously
- **Smart Caching**: Remembers your preferences for future reviews

### 🎨 Dual Interface Options
- **Code Review Panel**: Main interface for managing code review workflows and settings
- **Issues Panel**: Comprehensive overview of all detected issues with:
  - Color-coded severity indicators (Critical, High, Medium, Low)
  - Direct navigation to problematic code lines
  - Detailed issue descriptions and suggestions
  - Click-to-open file functionality with precise line positioning

### ⚙️ Customizable Experience
- **Language Support**: Focus on JavaScript/TypeScript with extensible language support
- **Template Customization**: Modify review templates to match your team's standards
- **Severity Thresholds**: Configure which issues to display based on your preferences
- **Manual AI Integration**: Copy prompts to use with your preferred AI provider

## 🛠️ Installation

1. Install the extension from the VS Code marketplace
2. Ensure you have at least one AI extension installed (Amazon Q, Copilot, Cursor AI, or ChatGPT)
3. For missing AI extensions, follow the provided installation guidance within the extension

## 📖 Usage

### Quick Start
1. **Select Change Type**: Choose between commit, branch, or local changes
2. **Configure Options**: Set comparison targets (commit hash, branch name, etc.)
3. **Choose AI Provider**: Select from your installed AI extensions
4. **Trigger Review**: Start the review process
5. **Review Results**: Navigate through issues in the sidebar or inline annotations

### Available Commands
- **`AI Code Review: Local Changes`** - Review uncommitted changes using git diff
- **`AI Code Review: All Files`** - Scan all files in the repository
- **`AI Code Review: Compare Branches`** - Compare changes between two branches
- **`AI Code Review: Check Code Review Result`** - Check and process AI review results
- **`AI Code Review: Open Prompt File`** - Open the generated prompt file
- **`AI Code Review: Open Change File`** - Open the change detection file
- **`AI Code Review: Open Settings`** - Open extension settings
- **`AI Code Review: Paste Prompt to AI Chat`** - Paste the generated prompt to AI chat

### 🔄 Automatic Result Processing

The extension includes an intelligent file watcher that automatically monitors the `.ai-code-review/results` directory for new AI review result files:

- **Automatic Detection**: When you save an AI response as a JSON file in `.ai-code-review/results/`, the extension automatically detects it
- **Instant Processing**: The `checkReviewResult` command is triggered automatically without manual intervention
- **Real-time Updates**: UI components (Issues Panel, Inline Annotations, Review History) are updated immediately
- **User Notification**: You'll receive a notification with an option to view the processed results
- **Background Operation**: The file watcher runs continuously while the extension is active

#### How It Works
1. Generate a code review prompt using any of the available commands
2. Copy the prompt to your preferred AI provider (ChatGPT, Claude, etc.)
3. Save the AI's JSON response to `.ai-code-review/results/your-result.json`
4. The extension automatically detects the new file and processes it
5. Review results appear instantly in the VS Code interface

### Change Type Examples

#### Commit Review
- Select "Commit Changes" type
- Enter commit hash or use smart defaults (last commit, parent commit)
- Choose AI provider and start review

#### Branch Comparison
- Select "Branch Changes" type
- Choose source and target branches
- Configure additional options as needed

#### Local Changes
- Select "Local Changes" type
- Review uncommitted modifications
- Get instant feedback on your current work

### File Management & Cleanup

#### Smart Cleanup Behavior
The extension automatically manages temporary files in the `.ai-code-review` directory:

- **Selective Cleanup**: When generating new review files, only cleans specific folders (`prompts/`, `changes/`, `results/`) to make room for new content
- **Complete Cleanup**: When the extension is deactivated, the entire `.ai-code-review` directory is removed to keep your workspace clean
- **Preservation**: Files in other subdirectories are preserved during selective cleanup operations

#### Manual Cleanup
You can manually clean up review files by:
1. Restarting the extension (triggers selective cleanup)
2. Disabling and re-enabling the extension (triggers complete cleanup)
3. Deleting the `.ai-code-review` folder manually

### Review History Management

#### Accessing Review History
1. **Activity Bar Icon**: Click the AI Code Review icon in the VS Code activity bar
2. **Review History Panel**: Navigate to the "Review History" tab within the AI Code Review container
3. **View All Reviews**: See a chronological list of all completed code reviews

#### Review Result Management
- **Automatic Detection**: Scans for AI review result files in the workspace
- **Structured Parsing**: Processes AI responses into organized issue lists
- **Issue Classification**: Categorizes issues by type, severity, and location
- **File Navigation**: Direct links to problematic code with line-level precision
- **Result Storage**: Saves processed results in `.ai-code-review/results/` directory

## 🔧 Configuration

### Default Settings
- **Change Type**: Local Changes
- **AI Provider**: Manual prompt generation for use with any AI provider
- **Language Focus**: JavaScript/TypeScript
- **Severity Display**: All levels (Low, Medium, High, Critical)

### Customization Options
- Modify review templates
- Set severity thresholds
- Configure change detection preferences
- Adjust language preferences
- Customize prompt generation behavior

## 🎯 Supported Languages

- **Primary Focus**: JavaScript, TypeScript, HTML, CSS
- **Additional Support**: Python, Java, C#, Go, Rust, PHP, Ruby, Swift, Kotlin
- **Extensible**: Framework for adding new language support through configuration

## 💾 Data Storage

The extension stores data in your workspace under `.ai-code-review/`:
- **`prompts/`**: Generated AI prompts for manual use
- **`changes/`**: Detected code changes and diff files
- **`results/`**: Processed AI review results
- **`cache/`**: Cached review results for performance
- **`logs/`**: Extension operation logs

All data is stored locally and never transmitted externally.

## 🤖 AI Development Process

### How This Extension Was Built
This project showcases the capabilities of AI-driven software development:

**🧠 AI Architecture Design**
- System architecture planned and designed by AI assistants
- Component relationships and data flow designed through AI collaboration
- File structure and organization patterns generated by AI

**💻 AI Code Generation**
- **TypeScript Classes**: All core classes (ChangeDetector, PromptGenerator, etc.) written by AI
- **VS Code Integration**: Extension manifest, commands, and API integrations created by AI
- **UI Components**: Sidebar panels, tree providers, and inline annotations generated by AI
- **Git Integration**: Complex git operations and diff parsing implemented by AI

**📚 AI Documentation**
- README, contributing guidelines, and code comments written by AI
- User guides and technical documentation generated through AI collaboration
- Code examples and usage instructions created by AI

**🔧 AI Problem Solving**
- Debugging and troubleshooting performed by AI assistants
- Performance optimizations and code improvements suggested by AI
- Feature enhancements and bug fixes implemented through AI guidance

**🎯 Development Methodology**
- Iterative development with AI feedback loops
- Test-driven development guided by AI recommendations
- Code review and quality assurance performed by AI tools

## 🚧 Roadmap

### Phase 1 (Current)
- Core change detection and prompt generation
- Manual AI integration workflow
- Result parsing and issue classification
- Dual panel interface (Code Review + Issues)

### Phase 2
- Additional programming language support
- Enhanced prompt templates and customization
- Advanced issue categorization and filtering
- Improved line number accuracy and navigation

### Phase 3
- Custom review templates and workflows
- Performance optimization and caching
- Integration with more development tools
- Team collaboration features

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Open in VS Code
4. Press F5 to run the extension in debug mode

### Development Commands
- `npm run compile` - Compile the TypeScript code
- `npm run watch` - Watch for changes and auto-compile
- `npm test` - Run the test suite
- `npm run lint` - Run ESLint checks

### Testing the Extension
After launching with F5, test the extension by:
1. Opening the Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
2. Running `AI Code Review: Local Changes` to generate a prompt for uncommitted changes
3. Running `AI Code Review: All Files` to scan all repository files
4. Using `AI Code Review: Check Code Review Result` to process AI responses

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

### AI Development Partners
This project was entirely developed through AI collaboration:
- **Claude (Anthropic)** - Primary development assistant for architecture, implementation, and documentation
- **Trae AI** - Advanced code analysis, refactoring, and optimization
- **GitHub Copilot** - Code completion and suggestions during development
- **Various AI Tools** - Testing, debugging, and feature validation

### Special Recognition
- **100% AI-Generated Codebase** - Every component, from TypeScript classes to JSON configurations, was created by AI
- **AI-Driven Architecture** - System design, file structure, and development patterns designed by AI
- **Collaborative AI Development** - Multiple AI tools working together to create a cohesive extension
- **Human-AI Partnership** - Demonstrates the potential of AI as a development partner

### Traditional Acknowledgments
- VS Code Extension API
- AI extension providers for their excellent tools
- Open source community for inspiration and support

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)

## Acknowledgments
- VS Code Extension API team
- AI provider communities
- Open source contributors