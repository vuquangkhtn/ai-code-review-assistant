# Testing the AI Code Review Extension

This guide explains how to test the AI Code Review Assistant extension using the test-examples folder.

## Overview

The `test-examples/` folder contains sample files with **intentional code issues** designed to validate the AI Code Review functionality. These are not traditional unit tests, but rather test cases for manual validation of the extension's AI review capabilities.

## Quick Start

### 1. Validate Test Files

```bash
# Run the test validation script
npm run test:examples

# Or run directly
node test-examples/run-review-test.js
```

This will:
- ✅ Verify all test files are present
- 📝 Check for issue markers in the code
- 📋 Display testing instructions
- 📊 Show any existing review results

### 2. Manual Testing Process

1. **Open VS Code** in the project root directory
2. **Open a test file** from `test-examples/` (e.g., `security-issues.js`)
3. **Open Command Palette** (`Cmd+Shift+P` / `Ctrl+Shift+P`)
4. **Run AI Code Review command**:
   - `AI Code Review: Copy Prompt for All Files`
   - `AI Code Review: Copy Prompt for Local Changes`
   - `AI Code Review: Copy Prompt for Branch Comparison`
5. **Paste the prompt** to your AI provider (ChatGPT, Claude, etc.)
6. **Save AI response** as JSON in `.ai-code-review/results/`
7. **Run** `AI Code Review: Check Code Review Result`
8. **Verify results** in the Code Review Panel

## Test Files and Expected Issues

### 🔒 `security-issues.js`
**Expected AI detections:**
- SQL Injection vulnerability (line 12)
- Cross-Site Scripting (XSS) vulnerability (line 18)
- Hardcoded credentials (lines 22-23)
- Insecure random number generation (line 27)
- Missing input validation (line 33)

### ⚡ `performance-issues.js`
**Expected AI detections:**
- O(n²) algorithms causing performance bottlenecks
- Memory leaks with event listeners
- Synchronous file operations blocking event loop
- Inefficient DOM manipulation
- Unnecessary re-computations
- Inefficient object creation patterns

### 🎨 `style-issues.js`
**Expected AI detections:**
- Inconsistent indentation and spacing
- Poor variable naming conventions
- Missing semicolons and inconsistent quotes
- Unused variables and imports
- Magic numbers without explanation
- Deeply nested code structures
- Poor error handling practices

### 📘 `typescript-issues.ts`
**Expected AI detections:**
- Overuse of `any` type
- Missing return type annotations
- Incorrect interface usage
- Missing null checks
- Unsafe type assertions
- Wrong enum usage
- Missing readonly modifiers

### ⚛️ `react-issues.jsx`
**Expected AI detections:**
- Missing key props in list rendering
- Incorrect useEffect dependency arrays
- Direct state mutation
- Inline object/function creation causing re-renders
- Missing cleanup in useEffect
- Using array index as key
- Improper async operation handling

## Validation Checklist

When testing, verify that the AI:

- ✅ **Identifies correct file paths** (matches actual file locations)
- ✅ **Points to appropriate line numbers** (close to actual issue locations)
- ✅ **Categorizes issues correctly** (security, performance, style, etc.)
- ✅ **Provides actionable suggestions** (specific fixes, not generic advice)
- ✅ **Doesn't reference generated files** (no mentions of prompt/result files)
- ✅ **Focuses on actual code problems** (not documentation or comments)
- ✅ **Uses proper JSON format** (valid structure for the extension)

## Testing Different Scenarios

### Single File Review
1. Open one test file (e.g., `security-issues.js`)
2. Run `AI Code Review: Copy Prompt for Local Changes`
3. Verify AI focuses only on that file

### Multiple Files Review
1. Make changes to multiple test files
2. Run `AI Code Review: Copy Prompt for All Files`
3. Verify AI reviews all modified files

### Branch Comparison
1. Create a new branch with test file modifications
2. Run `AI Code Review: Copy Prompt for Branch Comparison`
3. Verify AI compares changes between branches

## Troubleshooting

### No Issues Detected
- Ensure you're using a capable AI model (GPT-4, Claude 3, etc.)
- Check that the prompt includes the actual file content
- Verify the AI understands the specific language/framework

### Incorrect File Paths
- Make sure the workspace is opened at the project root
- Check that relative paths in the prompt are correct
- Verify the AI response uses exact file paths from the prompt

### Invalid JSON Response
- Ensure the AI response follows the exact JSON schema
- Check for missing commas, brackets, or quotes
- Validate JSON syntax before saving to results folder

### Extension Commands Not Working
- Verify the extension is installed and activated
- Check VS Code developer console for errors
- Ensure workspace folder is properly configured

## Advanced Testing

### Custom Test Cases
You can create additional test files by:
1. Adding new files with intentional issues
2. Including clear comments marking each issue
3. Updating the `run-review-test.js` script
4. Testing with different programming languages

### Automated Validation
For more advanced testing, you could:
- Parse AI responses programmatically
- Validate issue detection accuracy
- Compare results across different AI providers
- Track performance metrics over time

## Contributing

When adding new test cases:
1. **Include clear comments** explaining each issue
2. **Use realistic code examples** (not contrived examples)
3. **Cover different severity levels** (critical, major, minor)
4. **Test edge cases** and corner scenarios
5. **Update documentation** with new test cases

---

**Note**: These files contain intentional bugs and bad practices. Do not use these patterns in production code!