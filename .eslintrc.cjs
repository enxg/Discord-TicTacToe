module.exports = {
  env: {
    es2021: true,
    node: true,
  },
  extends: [
    "airbnb-base",
    "plugin:import/typescript",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: "module",
  },
  plugins: [
    "@typescript-eslint",
  ],
  rules: {
    quotes: [2, "double"],
    "comma-dangle": [2, "always-multiline"],
    "no-useless-constructor": 0,
    "no-trailing-spaces": 0,
    "no-undef": 0,
    "no-unused-vars": 0,
    "lines-between-class-members": 0,
    "import/extensions": 0,
    "dot-notation": 0,
    "no-unused-expressions": 0,
    "object-curly-newline": 0,
    "consistent-return": 0,
    "arrow-parens": [2, "as-needed"],
    "no-plusplus": 0,
    "no-nested-ternary": 0,
    "import/no-unresolved": 0,
    "keyword-spacing": 0,
  },
};
