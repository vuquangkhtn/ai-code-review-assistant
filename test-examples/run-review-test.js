#!/usr/bin/env node

/**
 * Test Script for AI Code Review Extension
 * 
 * This script demonstrates how to test the AI Code Review functionality
 * on the test-examples files with intentional code issues.
 * 
 * Usage:
 * 1. Open VS Code in the project root
 * 2. Open any file from test-examples/
 * 3. Run AI Code Review commands from Command Palette:
 *    - "AI Code Review: Copy Prompt for Local Changes"
 *    - "AI Code Review: Copy Prompt for All Files"
 *    - "AI Code Review: Copy Prompt for Branch Comparison"
 * 4. Paste the prompt to your AI provider
 * 5. Save the AI response as JSON in .ai-code-review/results/
 * 6. Run "AI Code Review: Check Code Review Result"
 */

const fs = require('fs');
const path = require('path');

// Test files with their expected issue categories
const testFiles = {
    'security-issues.js': {
        expectedIssues: ['SQL Injection', 'XSS', 'Hardcoded credentials', 'Insecure random'],
        categories: ['security', 'vulnerability']
    },
    'performance-issues.js': {
        expectedIssues: ['O(n²) algorithms', 'Memory leaks', 'Synchronous operations'],
        categories: ['performance', 'optimization']
    },
    'style-issues.js': {
        expectedIssues: ['Inconsistent formatting', 'Poor naming', 'Magic numbers'],
        categories: ['style', 'readability']
    },
    'typescript-issues.ts': {
        expectedIssues: ['any type overuse', 'Missing type annotations', 'Unsafe assertions'],
        categories: ['type-safety', 'typescript']
    },
    'react-issues.jsx': {
        expectedIssues: ['Missing keys', 'Direct state mutation', 'useEffect issues'],
        categories: ['react', 'hooks']
    }
};

function validateTestFiles() {
    console.log('🔍 Validating test-examples files...');
    
    const testDir = __dirname;
    let allFilesExist = true;
    
    for (const [filename, config] of Object.entries(testFiles)) {
        const filePath = path.join(testDir, filename);
        if (fs.existsSync(filePath)) {
            console.log(`✅ ${filename} - Found`);
            
            // Read file and check for issue markers
            const content = fs.readFileSync(filePath, 'utf8');
            const hasIssueComments = content.includes('Issue') || content.includes('Problem');
            
            if (hasIssueComments) {
                console.log(`   📝 Contains issue markers`);
            }
        } else {
            console.log(`❌ ${filename} - Missing`);
            allFilesExist = false;
        }
    }
    
    return allFilesExist;
}

function printTestInstructions() {
    console.log('\n📋 Manual Testing Instructions:');
    console.log('================================');
    console.log('\n1. Open VS Code in the project root directory');
    console.log('2. Open any test file from test-examples/');
    console.log('3. Open Command Palette (Cmd+Shift+P)');
    console.log('4. Run: "AI Code Review: Copy Prompt for All Files"');
    console.log('5. Paste the generated prompt to your AI provider');
    console.log('6. Save AI response as JSON in .ai-code-review/results/');
    console.log('7. Run: "AI Code Review: Check Code Review Result"');
    console.log('\n🎯 Expected Results:');
    console.log('- AI should detect security vulnerabilities in security-issues.js');
    console.log('- AI should identify performance problems in performance-issues.js');
    console.log('- AI should catch style issues in style-issues.js');
    console.log('- AI should find TypeScript issues in typescript-issues.ts');
    console.log('- AI should detect React anti-patterns in react-issues.jsx');
}

function checkReviewResults() {
    const resultsDir = path.join(__dirname, '..', '.ai-code-review', 'results');
    
    if (!fs.existsSync(resultsDir)) {
        console.log('\n⚠️  No results directory found. Run AI Code Review first.');
        return false;
    }
    
    const resultFiles = fs.readdirSync(resultsDir)
        .filter(file => file.endsWith('.json'))
        .sort((a, b) => b.localeCompare(a)); // Most recent first
    
    if (resultFiles.length === 0) {
        console.log('\n⚠️  No review result files found.');
        return false;
    }
    
    console.log(`\n📊 Found ${resultFiles.length} review result(s):`);
    resultFiles.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file}`);
    });
    
    // Analyze the most recent result
    const latestResult = path.join(resultsDir, resultFiles[0]);
    try {
        const result = JSON.parse(fs.readFileSync(latestResult, 'utf8'));
        
        if (result.issues && Array.isArray(result.issues)) {
            console.log(`\n✅ Latest result contains ${result.issues.length} issues`);
            
            // Group issues by file
            const issuesByFile = {};
            result.issues.forEach(issue => {
                const file = path.basename(issue.filePath || 'unknown');
                if (!issuesByFile[file]) {
                    issuesByFile[file] = [];
                }
                issuesByFile[file].push(issue);
            });
            
            Object.entries(issuesByFile).forEach(([file, issues]) => {
                console.log(`   📁 ${file}: ${issues.length} issues`);
            });
        }
    } catch (error) {
        console.log(`\n❌ Error reading result file: ${error.message}`);
    }
    
    return true;
}

// Main execution
if (require.main === module) {
    console.log('🧪 AI Code Review Test Runner');
    console.log('==============================\n');
    
    const filesValid = validateTestFiles();
    
    if (filesValid) {
        console.log('\n✅ All test files are present');
        printTestInstructions();
        checkReviewResults();
    } else {
        console.log('\n❌ Some test files are missing');
        process.exit(1);
    }
}

module.exports = {
    testFiles,
    validateTestFiles,
    checkReviewResults
};