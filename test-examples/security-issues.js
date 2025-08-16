// Test file with security vulnerabilities
const express = require('express');
const fs = require('fs');
const app = express();

// Mock database object for demonstration
const database = {
    query: (sql) => console.log('Executing:', sql)
};

// Security Issue 1: SQL Injection vulnerability
function getUserById(userId) {
    const query = `SELECT * FROM users WHERE id = ${userId}`;
    return database.query(query);
}

// Security Issue 2: XSS vulnerability
app.get('/user/:name', (req, res) => {
    const userName = req.params.name;
    res.send(`<h1>Hello ${userName}</h1>`);
});

// Security Issue 3: Hardcoded credentials
const API_KEY = 'sk-1234567890abcdef';
const DATABASE_PASSWORD = 'admin123';

// Security Issue 4: Insecure random number generation
function generateToken() {
    return Math.random().toString(36).substring(2);
}

// Security Issue 5: Missing input validation
app.post('/upload', (req, res) => {
    const file = req.body.file;
    fs.writeFileSync(`./uploads/${file.name}`, file.data);
    res.send('File uploaded');
});

module.exports = { getUserById, generateToken };