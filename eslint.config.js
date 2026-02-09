import js from '@eslint/js'
import prettier from 'eslint-config-prettier/flat'
import globals from 'globals'

export default [
  js.configs.recommended,

  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: globals.node,
    },
    rules: {
      // Complexity
      complexity: ['error', {max: 15}],
      'max-depth': ['error', 4],
      'max-params': ['error', 5],

      // Best practices
      'consistent-return': 'error',
      curly: 'error',
      'default-case': 'error',
      'dot-notation': ['error', {allowKeywords: true}],
      eqeqeq: 'off',
      'guard-for-in': 'error',
      'no-caller': 'error',
      'no-eval': 'error',
      'no-extend-native': 'error',
      'no-extra-bind': 'error',
      'no-implied-eval': 'error',
      'no-lone-blocks': 'error',
      'no-loop-func': 'error',
      'no-new': 'error',
      'no-new-func': 'error',
      'no-new-wrappers': 'error',
      'no-return-assign': 'error',
      'no-script-url': 'error',
      'no-self-compare': 'error',
      'no-sequences': 'error',
      'no-throw-literal': 'error',
      'no-unused-expressions': 'error',
      'no-useless-call': 'error',
      'no-useless-concat': 'error',
      'no-useless-return': 'error',
      'no-void': 'error',
      radix: 'error',
      yoda: 'error',

      // Variables
      'no-shadow': 'error',
      'no-label-var': 'error',
      'no-undef-init': 'error',
      'no-unused-vars': ['error', {args: 'none', vars: 'all', ignoreRestSiblings: true}],
      'no-use-before-define': ['error', 'nofunc'],

      // ES6+
      'no-useless-computed-key': 'error',
      'no-useless-constructor': 'error',
      'no-useless-rename': 'error',
      'no-var': 'error',
      'object-shorthand': ['error', 'methods'],
      'prefer-const': 'error',
      'prefer-numeric-literals': 'error',
      'prefer-promise-reject-errors': 'error',
      'prefer-rest-params': 'error',
      'prefer-spread': 'error',
      'prefer-template': 'error',
      'symbol-description': 'error',
      'no-template-curly-in-string': 'error',

      // Style (non-formatting)
      'no-alert': 'error',
      'no-bitwise': 'error',
      'no-console': ['error', {allow: ['warn', 'error']}],
      'no-else-return': 'error',
      'no-eq-null': 'error',
      'no-lonely-if': 'error',
      'no-multi-assign': 'error',
      'no-multi-str': 'error',
      'no-negated-condition': 'error',
      'no-nested-ternary': 'error',
      'no-restricted-globals': ['error', 'event'],
      'no-restricted-syntax': ['error', 'WithStatement'],
      'one-var': ['error', 'never'],
      'operator-assignment': ['error', 'always'],
      'prefer-arrow-callback': ['warn', {allowNamedFunctions: true}],
    },
  },

  {
    files: ['test/**/*.js'],
    rules: {
      'max-nested-callbacks': ['error', 4],
    },
  },

  {
    ignores: ['coverage/**'],
  },

  prettier,
]
