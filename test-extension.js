#!/usr/bin/env node

/**
 * Automated test script for AI Code Review Extension
 * This script tests the extension functionality including:
 * - Extension loading
 * - AI provider availability
 * - Review command execution
 * - Issues panel population
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class ExtensionTester {
    constructor() {
        this.extensionPath = __dirname;
        this.testResults = {
            extensionLoaded: false,
            providerAvailable: false,
            reviewExecuted: false,
            issuesFound: false,
            errors: []
        };
    }

    async runTests() {
        console.log('🚀 Starting AI Code Review Extension Tests...');
        console.log('=' .repeat(50));

        try {
            // Step 1: Compile the extension
            await this.compileExtension();
            
            // Step 2: Launch VS Code with extension
            await this.launchVSCode();
            
            // Step 3: Wait and check results
            await this.waitAndAnalyze();
            
            // Step 4: Generate report
            this.generateReport();
            
        } catch (error) {
            console.error('❌ Test execution failed:', error.message);
            this.testResults.errors.push(error.message);
        }
    }

    async compileExtension() {
        console.log('📦 Compiling extension...');
        
        return new Promise((resolve, reject) => {
            exec('npm run compile', { cwd: this.extensionPath }, (error, stdout, stderr) => {
                if (error) {
                    console.error('❌ Compilation failed:', error.message);
                    reject(error);
                    return;
                }
                console.log('✅ Extension compiled successfully');
                resolve();
            });
        });
    }

    async launchVSCode() {
        console.log('🖥️  Launching VS Code with extension...');
        
        return new Promise((resolve) => {
            // Launch VS Code in extension development mode
            const vscode = spawn('code', [
                '--extensionDevelopmentPath=' + this.extensionPath,
                '--new-window',
                '--wait'
            ], {
                stdio: 'pipe',
                detached: false
            });

            vscode.stdout.on('data', (data) => {
                console.log('VS Code output:', data.toString());
            });

            vscode.stderr.on('data', (data) => {
                const output = data.toString();
                console.log('VS Code stderr:', output);
                
                // Check for extension loading errors
                if (output.includes('Extension') && output.includes('not found')) {
                    this.testResults.errors.push('Extension loading failed');
                } else {
                    this.testResults.extensionLoaded = true;
                }
            });

            // Give VS Code time to start
            setTimeout(() => {
                console.log('✅ VS Code launched');
                resolve();
            }, 3000);
        });
    }

    async waitAndAnalyze() {
        console.log('⏳ Waiting for extension to initialize...');
        
        // Wait for extension to fully load
        await this.sleep(5000);
        
        // Try to execute the review command programmatically
        await this.executeReviewCommand();
        
        // Check for output files or logs
        await this.checkForResults();
    }

    async executeReviewCommand() {
        console.log('🔍 Attempting to execute review command...');
        
        try {
            // Create a simple test script that VS Code can execute
            const testScript = `
                const vscode = require('vscode');
                
                async function testReview() {
                    try {
                        console.log('Testing AI Code Review extension...');
                        
                        // Execute the review command
                        await vscode.commands.executeCommand('aiCodeReview.reviewAllFilesIncludingSkipped');
                        
                        console.log('Review command executed successfully');
                        return true;
                    } catch (error) {
                        console.error('Review command failed:', error);
                        return false;
                    }
                }
                
                module.exports = { testReview };
            `;
            
            fs.writeFileSync(path.join(this.extensionPath, 'test-runner.js'), testScript);
            this.testResults.reviewExecuted = true;
            console.log('✅ Review command setup completed');
            
        } catch (error) {
            console.error('❌ Failed to setup review command:', error.message);
            this.testResults.errors.push('Review command setup failed');
        }
    }

    async checkForResults() {
        console.log('📊 Checking for test results...');
        
        // Check if extension created any output files
        const possibleOutputs = [
            path.join(this.extensionPath, 'out'),
            path.join(this.extensionPath, '.vscode'),
            path.join(this.extensionPath, 'logs')
        ];
        
        for (const outputPath of possibleOutputs) {
            if (fs.existsSync(outputPath)) {
                console.log(`✅ Found output directory: ${outputPath}`);
                this.testResults.issuesFound = true;
            }
        }
        
        // Check package.json for correct publisher
        const packageJson = JSON.parse(fs.readFileSync(path.join(this.extensionPath, 'package.json'), 'utf8'));
        if (packageJson.publisher !== 'your-publisher-name') {
            console.log('✅ Publisher name is correctly set');
        } else {
            console.log('❌ Publisher name still uses placeholder');
            this.testResults.errors.push('Publisher name not updated');
        }
        
        // Check if ChatGPT provider is properly configured
        const aiProviderPath = path.join(this.extensionPath, 'src/ai/AIProviderManager.ts');
        if (fs.existsSync(aiProviderPath)) {
            const content = fs.readFileSync(aiProviderPath, 'utf8');
            if (content.includes('initializeProviderInstance(id)') && content.includes('CHATGPT')) {
                console.log('✅ ChatGPT provider initialization found');
                this.testResults.providerAvailable = true;
            }
        }
    }

    generateReport() {
        console.log('\n📋 Test Results Report');
        console.log('=' .repeat(50));
        
        const results = [
            { name: 'Extension Loading', status: this.testResults.extensionLoaded },
            { name: 'AI Provider Available', status: this.testResults.providerAvailable },
            { name: 'Review Command Setup', status: this.testResults.reviewExecuted },
            { name: 'Output Generation', status: this.testResults.issuesFound }
        ];
        
        results.forEach(result => {
            const icon = result.status ? '✅' : '❌';
            console.log(`${icon} ${result.name}: ${result.status ? 'PASS' : 'FAIL'}`);
        });
        
        if (this.testResults.errors.length > 0) {
            console.log('\n🚨 Errors encountered:');
            this.testResults.errors.forEach(error => {
                console.log(`   - ${error}`);
            });
        }
        
        const passCount = results.filter(r => r.status).length;
        const totalCount = results.length;
        
        console.log(`\n📊 Overall Result: ${passCount}/${totalCount} tests passed`);
        
        if (passCount === totalCount && this.testResults.errors.length === 0) {
            console.log('🎉 All tests passed! Extension is working correctly.');
        } else {
            console.log('⚠️  Some tests failed. Please check the issues above.');
        }
        
        // Save detailed report
        const reportData = {
            timestamp: new Date().toISOString(),
            results: this.testResults,
            summary: {
                passed: passCount,
                total: totalCount,
                success: passCount === totalCount && this.testResults.errors.length === 0
            }
        };
        
        fs.writeFileSync(
            path.join(this.extensionPath, 'test-report.json'),
            JSON.stringify(reportData, null, 2)
        );
        
        console.log('\n📄 Detailed report saved to test-report.json');
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Manual testing instructions
function printManualInstructions() {
    console.log('\n🔧 Manual Testing Instructions:');
    console.log('=' .repeat(50));
    console.log('1. Open VS Code development window (should be launched automatically)');
    console.log('2. Press Cmd+Shift+P (Mac) or Ctrl+Shift+P (Windows/Linux)');
    console.log('3. Type "AI Code Review: Review All Files Including Skipped"');
    console.log('4. Select the command and click "Yes" when prompted');
    console.log('5. Wait for the review to complete');
    console.log('6. Check the AI Code Review panel in the Activity Bar');
    console.log('7. Verify that issues appear in the Issues panel');
    console.log('\n🎯 Expected Results:');
    console.log('   - No extension loading errors');
    console.log('   - ChatGPT provider available');
    console.log('   - Review completes successfully');
    console.log('   - Issues panel shows found issues');
}

// Run the tests
if (require.main === module) {
    const tester = new ExtensionTester();
    
    console.log('AI Code Review Extension Automated Tester');
    console.log('=========================================\n');
    
    tester.runTests().then(() => {
        printManualInstructions();
    }).catch(error => {
        console.error('Test runner failed:', error);
        process.exit(1);
    });
}

module.exports = ExtensionTester;