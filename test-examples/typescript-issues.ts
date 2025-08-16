// Test file with TypeScript-specific issues

// Type Issue 1: Using 'any' type
function processData(data: any): any {
    return data.someProperty.nestedValue;
}

// Type Issue 2: Missing return type annotations
function calculateTotal(items) {
    return items.reduce((sum, item) => sum + item.price, 0);
}

// Type Issue 3: Incorrect interface usage
interface User {
    id: number;
    name: string;
    email: string;
}

function createUser(userData: any): User {
    return {
        id: userData.id,
        name: userData.firstName + ' ' + userData.lastName, // Wrong property names
        email: userData.emailAddress // Wrong property name
    };
}

// Type Issue 4: Missing null checks
function getUserName(user: User | null): string {
    return user.name; // Potential null reference
}

// Type Issue 5: Incorrect generic usage
class DataStore<T> {
    private items: any[] = []; // Should use T[]
    
    add(item: any): void { // Should use T
        this.items.push(item);
    }
    
    get(index: number): any { // Should return T | undefined
        return this.items[index];
    }
}

// Type Issue 6: Missing readonly for immutable data
interface Config {
    apiUrl: string;
    timeout: number;
    features: string[];
}

const appConfig: Config = {
    apiUrl: 'https://api.example.com',
    timeout: 5000,
    features: ['auth', 'analytics']
};

// Type Issue 7: Unsafe type assertions
function parseJson(jsonString: string): object {
    const result = JSON.parse(jsonString) as User; // Unsafe assertion
    return result;
}

// Type Issue 8: Missing error handling types
function fetchUserData(id: number): Promise<User> {
    return fetch(`/api/users/${id}`)
        .then(response => response.json()) // No error handling
        .then(data => data); // No type validation
}

// Type Issue 9: Inconsistent optional properties
interface Product {
    id: number;
    name: string;
    description?: string;
    price: number;
    category: string;
}

function displayProduct(product: Product): string {
    return `${product.name} - ${product.description.length} chars`; // Accessing optional property without check
}

// Type Issue 10: Wrong enum usage
enum Status {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected'
}

function updateStatus(newStatus: string): void { // Should use Status enum
    console.log(`Status updated to: ${newStatus}`);
}

export {
    processData,
    calculateTotal,
    createUser,
    getUserName,
    DataStore,
    appConfig,
    parseJson,
    fetchUserData,
    displayProduct,
    updateStatus,
    Status
};