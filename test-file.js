// Test file to demonstrate real code analysis
async function processUserData(userData) {
    console.log('Processing user data:', userData); // This should be flagged
    
    // TODO: Add validation here
    const password = 'hardcoded-secret-123'; // This should be flagged as security issue
    
    // Large function without error handling
    const result = await fetch('/api/users', {
        method: 'POST',
        body: JSON.stringify(userData)
    }); // This should be flagged for missing error handling
    
    return result.json();
}

// Function with any type (if this was TypeScript)
function handleData(data) {
    // FIXME: This needs proper implementation
    return data;
}