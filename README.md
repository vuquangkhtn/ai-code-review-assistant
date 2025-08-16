# AI Code Review Assistant

A powerful VS Code extension that automates code review using AI to provide senior-level feedback on your code changes.

## 🚀 Features

### 🔍 Multi-Format Code Change Analysis
- **Commit Changes**: Compare against specific commit hashes with smart defaults
- **Branch Changes**: Compare against any branch with easy branch selection
- **Local Changes**: Review uncommitted changes in real-time

### 🤖 AI-Powered Code Review
- **Multiple AI Providers**: Seamlessly integrate with installed AI extensions
  - **GitHub Copilot** - Full implementation with code review simulation
  - **Amazon Q** - Full implementation with AWS-focused code review
  - **Cursor AI** - Full implementation with modern development practices review
  - **ChatGPT** - Full implementation with general code quality review
- **Smart Detection**: Automatically detects installed extensions and provides installation guidance for missing ones
- **Installation Support**: Helps users install missing AI extensions with direct marketplace links and extension IDs
- **Working Implementations**: All providers are fully functional with realistic code review simulations
- **No API Keys Required**: Works entirely with your existing AI tools

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

### 🎨 Triple Interface Options
- **Dedicated Sidebar Panel**: Comprehensive overview of all issues grouped by severity
- **Review History Panel**: Complete history of all code reviews with detailed tracking
- **Inline Editor Annotations**: Contextual hints and suggestions directly in your code
- **Navigation**: Jump directly to problematic lines from the issue panel

### ⚙️ Customizable Experience
- **Language Support**: Focus on JavaScript/TypeScript with extensible language support
- **Template Customization**: Modify review templates to match your team's standards
- **Severity Thresholds**: Configure which issues to display based on your preferences
- **Default AI Selection**: Set your preferred AI provider for automatic reviews

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
- **`AI Code Review: Start Review`** - Start a new code review
- **`AI Code Review: Review Local Changes`** - Review uncommitted changes
- **`AI Code Review: Review Commit Changes`** - Review specific commit changes
- **`AI Code Review: Review Branch Changes`** - Review branch differences
- **`AI Code Review: Show AI Providers`** - View status of all AI providers
- **`AI Code Review: Refresh AI Providers`** - Refresh provider detection
- **`AI Code Review: Debug AI Providers`** - Debug provider detection issues
- **`AI Code Review: Test Extension`** - Test if extension is working
- **`AI Code Review: Refresh History`** - Refresh the review history panel
- **`AI Code Review: Clear History`** - Clear all review history
- **`AI Code Review: Export History`** - Export review history to JSON file

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

### Review History Management

#### Accessing Review History
1. **Activity Bar Icon**: Click the AI Code Review icon in the VS Code activity bar
2. **Review History Panel**: Navigate to the "Review History" tab within the AI Code Review container
3. **View All Reviews**: See a chronological list of all completed code reviews

#### Review History Features
- **Chronological Display**: Reviews sorted by date (newest first)
- **Summary Statistics**: Quick overview of issues found (Total, Critical, High, Medium, Low)
- **AI Provider Tracking**: See which AI provider was used for each review
- **Detailed View**: Click "View" to open a detailed markdown report of any review
- **Individual Management**: Delete specific reviews or export history
- **Bulk Operations**: Clear all history or export complete review data

#### Review History Actions
- **View Details**: Opens a comprehensive markdown document with full review details
- **Delete Review**: Remove individual reviews from history
- **Export History**: Save all review data as JSON for backup or analysis
- **Clear All**: Remove all review history (with confirmation)
- **Refresh**: Update the history display with latest data

## 🔧 Configuration

### Default Settings
- **Change Type**: Local Changes
- **AI Provider**: First available installed extension
- **Language Focus**: JavaScript/TypeScript
- **Severity Display**: All levels (Low, Medium, High, Critical)

### Customization Options
- Modify review templates
- Set severity thresholds
- Configure default AI provider
- Adjust language preferences
- Customize caching behavior

## 🎯 Supported Languages

- **Primary Focus**: JavaScript, TypeScript, HTML
- **Planned Support**: Python, Java, C#, Go, Rust
- **Extensible**: Framework for adding new language support

## 💾 Data Storage

- **Local Storage**: All review results and preferences saved locally
- **No Cloud Sync**: Your code and review data stays on your machine
- **Cache Management**: Intelligent caching with user control

## 🚧 Roadmap

### Phase 1 (Current)
- Core change detection and AI integration
- Basic review template and issue classification
- Sidebar panel and inline annotations

### Phase 2
- Additional programming language support
- Advanced issue categorization and tagging
- Team collaboration features (local sharing)

### Phase 3
- Custom review templates
- Performance optimization
- Advanced AI provider integration

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
2. Running `AI Code Review: Test Extension` to verify it's working
3. Running `AI Code Review: Start Review` to test the main functionality

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- VS Code Extension API
- AI extension providers for their excellent tools
- Open source community for inspiration and support

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)
Documentation: Wiki

## Acknowledgments
- VS Code Extension API team
- AI provider communities
- Open source contributors