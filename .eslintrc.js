module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
    },
    plugins: ['@typescript-eslint'],
    extends: [
        'eslint:recommended',
    ],
    rules: {
        'no-unused-vars': 'warn',
    },
    env: {
        node: true,
        es6: true,
    },
};
