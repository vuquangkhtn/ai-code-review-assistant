# Contributing to AI Code Review Assistant

Thank you for your interest in contributing to the AI Code Review Assistant! This document provides guidelines and information for contributors.

## Getting Started

### Prerequisites
- Node.js 16.0.0 or higher
- VS Code 1.74.0 or higher
- Git

### Development Setup
1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Compile the extension: `npm run compile`
4. Open the project in VS Code
5. Press F5 to run the extension in debug mode

## Project Structure

```
src/
├── ai/                    # AI provider integrations
│   ├── providers/        # Individual AI provider implementations
│   └── AIProviderManager.ts
├── core/                 # Core functionality
│   ├── CodeReviewManager.ts
│   ├── ChangeDetector.ts
│   └── StorageManager.ts
├── ui/                   # User interface components
│   ├── IssuesPanelProvider.ts
│   └── InlineAnnotationsProvider.ts
├── types/                # TypeScript type definitions
│   └── index.ts
└── extension.ts          # Main extension entry point
```

## Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow the existing code style and formatting
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Keep functions small and focused

### Testing
- Write tests for new functionality
- Ensure all tests pass before submitting PRs
- Use descriptive test names
- Test both success and error scenarios

### Git Workflow
1. Create a feature branch from `main`
2. Make your changes
3. Commit with clear, descriptive messages
4. Push your branch and create a pull request
5. Ensure CI checks pass

## Adding New AI Providers

To add support for a new AI provider:

1. Create a new provider class in `src/ai/providers/`
2. Extend `AbstractAIProvider` or implement `BaseAIProvider`
3. Add the provider type to the `AIProviderType` enum
4. Register the provider in `AIProviderManager`
5. Add tests for the new provider

Example:
```typescript
export class NewAIProvider extends AbstractAIProvider {
    public readonly id = 'new-ai-provider';
    public readonly name = 'New AI Provider';
    public readonly isAvailable = true;

    public async performReview(request: ReviewRequest): Promise<ReviewResult> {
        // Implementation here
    }
}
```

## Adding New Features

1. **Plan the feature**: Document requirements and design
2. **Update types**: Add necessary interfaces and enums
3. **Implement core logic**: Add functionality to appropriate classes
4. **Update UI**: Modify or add UI components as needed
5. **Add tests**: Ensure comprehensive test coverage
6. **Update documentation**: Keep README and other docs current

## Reporting Issues

When reporting issues:

1. Use the issue template
2. Provide clear steps to reproduce
3. Include error messages and logs
4. Specify your environment (OS, VS Code version, etc.)
5. Add screenshots if relevant

## Pull Request Process

1. **Title**: Use clear, descriptive titles
2. **Description**: Explain what the PR does and why
3. **Testing**: Describe how you tested the changes
4. **Breaking changes**: Note any breaking changes
5. **Screenshots**: Include UI changes if applicable

## Code Review

All contributions require code review:

1. Address review comments promptly
2. Keep discussions constructive and respectful
3. Be open to feedback and suggestions
4. Ask questions if something is unclear

## Release Process

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create a release tag
4. Publish to VS Code marketplace

## Getting Help

- **Issues**: Use GitHub issues for bugs and feature requests
- **Discussions**: Use GitHub discussions for questions and ideas
- **Documentation**: Check the README and wiki

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Follow the project's coding standards

Thank you for contributing to making AI Code Review Assistant better!
