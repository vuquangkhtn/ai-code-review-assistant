// Test file with performance issues

// Performance Issue 1: Inefficient loop with O(n²) complexity
function findDuplicates(arr) {
    const duplicates = [];
    for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
            if (arr[i] === arr[j] && !duplicates.includes(arr[i])) {
                duplicates.push(arr[i]);
            }
        }
    }
    return duplicates;
}

// Performance Issue 2: Memory leak with event listeners
class EventManager {
    constructor() {
        this.listeners = [];
    }
    
    addListener(element, event, handler) {
        element.addEventListener(event, handler);
        this.listeners.push({ element, event, handler });
        // Missing cleanup method
    }
}

// Performance Issue 3: Synchronous file operations
const fs = require('fs');

function processFiles(filePaths) {
    const results = [];
    for (const path of filePaths) {
        const content = fs.readFileSync(path, 'utf8'); // Blocking operation
        results.push(content.toUpperCase());
    }
    return results;
}

// Performance Issue 4: Inefficient DOM manipulation (browser environment)
function updateList(items) {
    // eslint-disable-next-line no-undef
    const list = document.getElementById('list');
    list.innerHTML = ''; // Causes reflow
    
    for (const item of items) {
        // eslint-disable-next-line no-undef
        const li = document.createElement('li');
        li.textContent = item;
        list.appendChild(li); // Multiple reflows
    }
}

// Performance Issue 5: Unnecessary re-renders in React-like component
function UserList({ users, filter }) {
    // Expensive computation on every render
    const filteredUsers = users.filter(user => {
        return user.name.toLowerCase().includes(filter.toLowerCase());
    }).sort((a, b) => a.name.localeCompare(b.name));
    
    return filteredUsers.map(user => `<div>${user.name}</div>`).join('');
}

// Performance Issue 6: Large object creation in loop
function generateReport(data) {
    const report = [];
    for (let i = 0; i < data.length; i++) {
        report.push({
            id: i,
            timestamp: new Date(),
            data: JSON.parse(JSON.stringify(data[i])), // Deep clone inefficiency
            metadata: {
                processed: true,
                version: '1.0',
                created: new Date().toISOString()
            }
        });
    }
    return report;
}

module.exports = {
    findDuplicates,
    EventManager,
    processFiles,
    updateList,
    UserList,
    generateReport
};