// Test file with style and code quality issues

// Style Issue 1: Inconsistent indentation and spacing
function badFormatting(x,y,z){
if(x>y){
return z+1;
}else{
  return z-1;
}
}

// Style Issue 2: Long lines and poor variable names
const veryLongVariableNameThatExceedsReasonableLengthAndMakesCodeHardToReadAndUnderstand = 'some value';
function processDataWithVeryLongFunctionNameThatDoesNotFollowNamingConventions(a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    return a + b + c + d + e + f + g + h + i + j + k + l + m + n + o + p;
}

// Style Issue 3: Missing semicolons and inconsistent quotes
const name = "John"
const age = 25
const city = 'New York'
const country = `USA`

// Style Issue 4: Unused variables and imports
const unusedVariable = 'never used';
const anotherUnusedVar = 42;
const fs = require('fs'); // unused import

function useOnlyOneVariable() {
    const used = 'this is used';
    const notUsed = 'this is not used';
    return used;
}

// Style Issue 5: Magic numbers and unclear logic
function calculatePrice(quantity) {
    if (quantity > 100) {
        return quantity * 0.85 * 1.2 * 0.95;
    } else if (quantity > 50) {
        return quantity * 0.9 * 1.2 * 0.98;
    } else {
        return quantity * 1.2;
    }
}

// Style Issue 6: Deeply nested code
function processOrder(order) {
    if (order) {
        if (order.items) {
            if (order.items.length > 0) {
                for (let i = 0; i < order.items.length; i++) {
                    if (order.items[i]) {
                        if (order.items[i].price) {
                            if (order.items[i].price > 0) {
                                if (order.items[i].quantity) {
                                    if (order.items[i].quantity > 0) {
                                        console.log('Processing item:', order.items[i].name);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

// Style Issue 7: Inconsistent function declarations
const arrowFunction = () => {
    return 'arrow';
};

function regularFunction() {
    return 'regular';
}

var oldStyleFunction = function() {
    return 'old style';
};

// Style Issue 8: Poor error handling
function riskyOperation(data) {
    try {
        return JSON.parse(data).result.value.amount;
    } catch (e) {
        // Empty catch block
    }
}

// Style Issue 9: Inconsistent naming conventions
const snake_case_var = 'bad';
const camelCaseVar = 'good';
const PascalCaseVar = 'wrong for variable';
const SCREAMING_SNAKE_CASE = 'should be const';

module.exports={badFormatting,processDataWithVeryLongFunctionNameThatDoesNotFollowNamingConventions,calculatePrice,processOrder,arrowFunction,regularFunction,oldStyleFunction,riskyOperation};