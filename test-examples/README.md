# Code Review Test Examples

This directory contains test files with intentional code quality issues to demonstrate and test the AI Code Review Assistant functionality.

## Test Files Overview

### 1. `security-issues.js`
**Purpose**: Demonstrates security vulnerabilities that should be caught by code review.

**Issues included**:
- SQL Injection vulnerability
- Cross-Site Scripting (XSS) vulnerability
- Hardcoded credentials
- Insecure random number generation
- Missing input validation

### 2. `performance-issues.js`
**Purpose**: Shows common performance problems in JavaScript code.

**Issues included**:
- Inefficient O(n²) algorithms
- Memory leaks with event listeners
- Synchronous file operations blocking the event loop
- Inefficient DOM manipulation causing multiple reflows
- Unnecessary re-computations in render functions
- Inefficient object creation and deep cloning

### 3. `style-issues.js`
**Purpose**: Demonstrates code style and formatting problems.

**Issues included**:
- Inconsistent indentation and spacing
- Long lines and poor variable naming
- Missing semicolons and inconsistent quotes
- Unused variables and imports
- Magic numbers without explanation
- Deeply nested code structures
- Inconsistent function declaration styles
- Poor error handling practices
- Inconsistent naming conventions

### 4. `typescript-issues.ts`
**Purpose**: Shows TypeScript-specific type safety and best practice violations.

**Issues included**:
- Overuse of `any` type
- Missing return type annotations
- Incorrect interface usage
- Missing null checks
- Incorrect generic usage
- Missing readonly modifiers for immutable data
- Unsafe type assertions
- Missing error handling types
- Inconsistent optional property handling
- Wrong enum usage

### 5. `react-issues.jsx`
**Purpose**: Demonstrates React-specific anti-patterns and common mistakes.

**Issues included**:
- Missing key props in list rendering
- Incorrect useEffect dependency arrays
- Direct state mutation
- Inline object/function creation causing re-renders
- Missing cleanup in useEffect
- Incorrect conditional rendering
- Using array index as key
- Improper async operation handling

## How to Use These Test Files

### Testing the Code Review Extension

1. **Open a test file** in VS Code
2. **Make some changes** to trigger the code review
3. **Run the AI Code Review** command
4. **Verify the AI detects** the intentional issues

### Expected AI Review Results

The AI should identify and categorize issues as:
- **Security**: Vulnerabilities that could be exploited
- **Performance**: Code that could cause slowdowns or resource issues
- **Style**: Formatting and readability problems
- **Maintainability**: Code that's hard to understand or modify
- **Best Practices**: Violations of language/framework conventions
- **Testing**: Missing or inadequate test coverage

### Testing Different Review Modes

1. **Single File Review**: Open one test file and review it
2. **Multiple Files Review**: Select multiple test files for batch review
3. **Workspace Analysis**: Use the "All Files" mode to analyze the entire test-examples directory

### Validating AI Responses

Check that the AI:
- ✅ Identifies the correct file paths
- ✅ Points to appropriate line numbers
- ✅ Categorizes issues correctly
- ✅ Provides actionable suggestions
- ✅ Doesn't reference generated prompt files
- ✅ Focuses on actual code problems

## Adding New Test Cases

When adding new test files:
1. Include clear comments explaining each issue
2. Use realistic code examples
3. Cover different severity levels
4. Test edge cases and corner scenarios
5. Update this README with the new test cases

## Notes

- These files contain **intentional bugs and bad practices**
- **Do not use** these patterns in production code
- The files are designed to **trigger linting errors** - this is expected
- Some issues may require specific AI models or prompts to detect