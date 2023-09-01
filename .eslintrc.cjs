module.exports = {
    root: true,
    extends: [
        "eslint:recommended",
        'plugin:@typescript-eslint/recommended-type-checked',
    ],
    parser: "@typescript-eslint/parser",
    parserOptions: {
        project: './tsconfig.json',
    },
    plugins: [
        "@typescript-eslint"
    ]
}
