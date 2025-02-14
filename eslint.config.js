export default [{
  "extends": [
    "next",
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended"
  ],
  "settings": {
    "import/internal-regex": "^(components|hooks|layouts|lib|public|styles|static|utils)"
  },
  "rules": {
    "@typescript-eslint/consistent-type-imports": [
      "error",
      {
        "prefer": "type-imports"
      }
    ],
    "@typescript-eslint/array-type": "error",
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/member-delimiter-style": [
      "error",
      {
        "multiline": {
          "delimiter": "semi",
          "requireLast": true
        },
        "singleline": {
          "delimiter": "semi",
          "requireLast": false
        },
        "multilineDetection": "brackets"
      }
    ],
    "@typescript-eslint/no-empty-function": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/object-curly-spacing": [
      "error",
      "always"
    ],
    "import/no-default-export": "warn",
    "import/order": [
      "error",
      {
        "alphabetize": {
          "order": "asc",
          "caseInsensitive": true
        },
        "newlines-between": "always",
        "groups": [
          "builtin",
          "external",
          "internal",
          "object",
          "parent",
          "sibling",
          "index"
        ]
      }
    ],
    "import/prefer-default-export": "off",
    "jsx-quotes": [
      "error",
      "prefer-single"
    ],
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}]
