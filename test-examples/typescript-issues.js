"use strict";
// Test file with TypeScript-specific issues
Object.defineProperty(exports, "__esModule", { value: true });
exports.Status = exports.updateStatus = exports.displayProduct = exports.fetchUserData = exports.parseJson = exports.appConfig = exports.DataStore = exports.getUserName = exports.createUser = exports.calculateTotal = exports.processData = void 0;
// Type Issue 1: Using 'any' type
function processData(data) {
    return data.someProperty.nestedValue;
}
exports.processData = processData;
// Type Issue 2: Missing return type annotations
function calculateTotal(items) {
    return items.reduce((sum, item) => sum + item.price, 0);
}
exports.calculateTotal = calculateTotal;
function createUser(userData) {
    return {
        id: userData.id,
        name: userData.firstName + ' ' + userData.lastName,
        email: userData.emailAddress // Wrong property name
    };
}
exports.createUser = createUser;
// Type Issue 4: Missing null checks
function getUserName(user) {
    return user.name; // Potential null reference
}
exports.getUserName = getUserName;
// Type Issue 5: Incorrect generic usage
class DataStore {
    constructor() {
        this.items = []; // Should use T[]
    }
    add(item) {
        this.items.push(item);
    }
    get(index) {
        return this.items[index];
    }
}
exports.DataStore = DataStore;
const appConfig = {
    apiUrl: 'https://api.example.com',
    timeout: 5000,
    features: ['auth', 'analytics']
};
exports.appConfig = appConfig;
// Type Issue 7: Unsafe type assertions
function parseJson(jsonString) {
    const result = JSON.parse(jsonString); // Unsafe assertion
    return result;
}
exports.parseJson = parseJson;
// Type Issue 8: Missing error handling types
function fetchUserData(id) {
    return fetch(`/api/users/${id}`)
        .then(response => response.json()) // No error handling
        .then(data => data); // No type validation
}
exports.fetchUserData = fetchUserData;
function displayProduct(product) {
    return `${product.name} - ${product.description.length} chars`; // Accessing optional property without check
}
exports.displayProduct = displayProduct;
// Type Issue 10: Wrong enum usage
var Status;
(function (Status) {
    Status["PENDING"] = "pending";
    Status["APPROVED"] = "approved";
    Status["REJECTED"] = "rejected";
})(Status || (Status = {}));
exports.Status = Status;
function updateStatus(newStatus) {
    console.log(`Status updated to: ${newStatus}`);
}
exports.updateStatus = updateStatus;
//# sourceMappingURL=typescript-issues.js.map