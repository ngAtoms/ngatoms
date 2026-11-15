// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import angular from '@angular-eslint/eslint-plugin';
import angularTemplate from '@angular-eslint/eslint-plugin-template';
import angularTemplateParser from '@angular-eslint/template-parser';
import globals from 'globals';
import jsdoc from 'eslint-plugin-jsdoc';

/**
 * Local rule: documentation lives in JSDoc blocks, never in `//` comments.
 * Directives the toolchain reads (`// @ts-…`, `// eslint-…`) are left alone.
 */
const noLineComments = {
  meta: {
    type: 'suggestion',
    schema: [],
    messages: { line: 'Line comments are not allowed. Document intent in the JSDoc header instead.' },
  },
  create(context) {
    return {
      Program() {
        for (const comment of context.sourceCode.getAllComments()) {
          const isDirective = /^\s*(@ts-|eslint-)/.test(comment.value);
          if (comment.type === 'Line' && !isDirective) {
            context.report({ loc: comment.loc, messageId: 'line' });
          }
        }
      },
    };
  },
};

/**
 * Code that follows the documentation standard: a `@file` header per file,
 * a JSDoc header per function, and no line comments. It starts with the
 * grid and will widen to every primitive.
 */
const DOCUMENTED_CODE = [
  'packages/primitives/src/grid-core/**/*.ts',
  'packages/primitives/src/grid/**/*.ts',
];

export default tseslint.config(
  // ── Ignored paths ─────────────────────────────────────────────
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/*.js.map',
      '.changeset/**',
      'tools/**',
    ],
  },

  // ── TypeScript — Angular packages + docs app ───────────────────
  {
    files: [
      'packages/primitives/src/**/*.ts',
      'packages/utils/src/**/*.ts',
      'apps/docs/src/**/*.ts',
    ],
    extends: tseslint.configs.recommended,
    plugins: {
      '@angular-eslint': angular,
    },
    languageOptions: {
      parser: tseslint.parser,
    },
    rules: {
      // ── TypeScript ─────────────────────────────────────────────
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

      // ── Angular ────────────────────────────────────────────────
      '@angular-eslint/contextual-lifecycle': 'error',
      '@angular-eslint/no-empty-lifecycle-method': 'error',
      '@angular-eslint/no-input-rename': 'error',
      '@angular-eslint/no-inputs-metadata-property': 'error',
      '@angular-eslint/no-output-native': 'error',
      '@angular-eslint/no-output-on-prefix': 'error',
      '@angular-eslint/no-output-rename': 'error',
      '@angular-eslint/no-outputs-metadata-property': 'error',
      '@angular-eslint/prefer-standalone': 'error',
      '@angular-eslint/use-pipe-transform-interface': 'error',
      '@angular-eslint/use-lifecycle-interface': 'warn',
    },
  },

  // ── grid-core is framework-free: it must stay usable (and testable)
  //    without Angular, so the renderer can be swapped or reused.
  {
    files: ['packages/primitives/src/grid-core/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['@angular/*'], message: 'grid-core must not depend on Angular.' },
          ],
        },
      ],
    },
  },

  // ── Documentation standard (see CONTRIBUTING.md → Code Guidelines) ──
  {
    files: DOCUMENTED_CODE,
    plugins: { jsdoc, ngatoms: { rules: { 'no-line-comments': noLineComments } } },
    rules: {
      'ngatoms/no-line-comments': 'error',
      'jsdoc/require-file-overview': 'error',
      'jsdoc/require-jsdoc': [
        'error',
        {
          checkConstructors: false,
          contexts: ['VariableDeclarator > ArrowFunctionExpression', 'PropertyDefinition > ArrowFunctionExpression'],
          require: {
            ArrowFunctionExpression: false,
            ClassDeclaration: true,
            FunctionDeclaration: true,
            FunctionExpression: true,
            MethodDefinition: true,
          },
        },
      ],
    },
  },

  // ── Specs and benchmarks keep the file header and the comment rule,
  //    but their small local helpers do not each need a JSDoc block.
  {
    files: ['packages/primitives/src/grid-core/**/*.{spec,bench}.ts', 'packages/primitives/src/grid/**/*.spec.ts'],
    rules: { 'jsdoc/require-jsdoc': 'off' },
  },

  // ── Spec files — relaxed rules ──────────────────────────────────
  {
    files: ['packages/primitives/src/**/*.spec.ts', 'apps/docs/src/**/*.spec.ts'],
    rules: {
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // ── HTML templates ─────────────────────────────────────────────
  {
    files: ['apps/docs/src/**/*.html'],
    plugins: {
      '@angular-eslint/template': angularTemplate,
    },
    languageOptions: {
      parser: angularTemplateParser,
    },
    rules: {
      '@angular-eslint/template/banana-in-box': 'error',
      '@angular-eslint/template/no-negated-async': 'warn',
      '@angular-eslint/template/no-duplicate-attributes': 'error',
    },
  },

  // ── CLI — plain JavaScript (Node.js) ──────────────────────────
  {
    files: ['packages/ngatoms/src/**/*.js', 'packages/ngatoms/bin/**/*.js'],
    extends: [eslint.configs.recommended],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
);
