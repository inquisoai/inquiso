// Enforces Conventional Commits v1.0.0 (docs/08-coding-standards.md).
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      1,
      'always',
      [
        'agent',
        'providers',
        'auth',
        'cache',
        'context',
        'ui',
        'content',
        'security',
        'messaging',
        'platform',
        'build',
        'ci',
        'docs',
        'deps',
        'lint',
        'test',
        'release',
        'chat',
        'prompts',
      ],
    ],
  },
}
