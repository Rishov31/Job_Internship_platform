module.exports = {
  extends: [
    'react-app',
    'react-app/jest'
  ],
  rules: {
    'no-unused-vars': 'warn',
    'jsx-a11y/anchor-is-valid': 'warn'
  },
  settings: {
    react: {
      version: 'detect'
    }
  }
};
