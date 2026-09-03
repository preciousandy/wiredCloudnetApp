const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  ...expoConfig,
  {
    ignores: ['dist/*', '.expo/*', 'node_modules/*'],
  },
  {
    rules: {
      // Money and auth code must not silently swallow promises.
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'react-hooks/exhaustive-deps': 'error',
      eqeqeq: ['error', 'always'],
      'no-restricted-syntax': [
        'error',
        {
          // Enforces the architecture rule: components never call fetch directly.
          // The API client layer (src/api/client.ts) is the only place fetch should be called.
          selector: "CallExpression[callee.name='fetch']:not(:matches([callee.object.name='window'], [callee.object.name='global']))",
          message:
            'Do not call fetch directly. Go through src/api/services, see the architecture spec, section 4.',
        },
      ],
    },
  },
  {
    files: ['src/api/client.ts'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
];
