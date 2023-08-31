module.exports = {
    root: true,
    extends: [
      "eslint:recommended",
      'plugin:@typescript-eslint/recommended-type-checked',
    ],
    parser: "@typescript-eslint/parser",
    plugins: [
        "@typescript-eslint"
    ]
}
