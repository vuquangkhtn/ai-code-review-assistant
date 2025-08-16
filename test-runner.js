
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
            