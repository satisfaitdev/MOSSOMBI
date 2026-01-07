module.exports = {
  extends: ['expo', 'prettier'],
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': 'warn',
    'react/no-unescaped-entities': 'warn', // Downgrade to warning
    '@typescript-eslint/no-unused-vars': 'warn', // Downgrade to warning
    'no-undef': 'off', // Disable for jest.setup.js and scripts
  },
  overrides: [
    {
      files: ['jest.setup.js', 'scripts/**/*.js'],
      env: {
        node: true,
        jest: true,
      },
      rules: {
        'no-undef': 'off',
        '@typescript-eslint/no-require-imports': 'off',
      },
    },
  ],
};
