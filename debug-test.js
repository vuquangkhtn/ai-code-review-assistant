// Test file to trigger code analysis - FINAL TEST
console.log('This should trigger a console.log issue - FINAL TEST');

// TODO: This should trigger a TODO issue
const secret = 'hardcoded-secret-key';

async function testFunction() {
    await fetch('/api/data'); // Missing error handling
}

// FIXME: This needs to be fixed
let data = {}; // This would be any type in TypeScript