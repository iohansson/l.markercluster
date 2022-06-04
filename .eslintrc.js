module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
  ],
  env: {
    browser: true,
    node: true,
    es2022: true,
  },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  ecmaFeatures: {
    modules: true,
  },
  rules: {
    'max-len': [
      'warn',
      160,
    ],
    indent: [
      'error',
      2,
      {
        SwitchCase: 1,
      },
    ],
    quotes: [
      'error',
      'single',
      {
        avoidEscape: true,
        allowTemplateLiterals: true,
      },
    ],
    'operator-linebreak': [
      'error',
      'before',
    ],
    'one-var': [
      'error',
      {
        var: 'never',
        let: 'never',
        const: 'never',
      },
    ],
    'no-unreachable': 'error',
    semi: [
      'error',
      'always',
    ],
    'comma-dangle': ['error', 'always-multiline'],
    'quote-props': ['error', 'as-needed'],
    'no-use-before-define': ['error', 'nofunc'],
    'block-spacing': ['error', 'always'],
    'object-curly-spacing': ['error', 'always'],
    'object-shorthand': ['error', 'always'],
    'space-before-function-paren': ['error', {
      anonymous: 'always',
      asyncArrow: 'always',
      named: 'never',
    }],
  },
};
