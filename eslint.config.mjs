import js from '@eslint/js';
import ts from 'typescript-eslint';
import astro from 'eslint-plugin-astro';

/**
 * Lint rules for the site.
 *
 * ESLint is used rather than Biome because eslint-plugin-astro parses a whole
 * `.astro` file: frontmatter, template and `<script>` together. A tool that
 * reads the frontmatter alone reports every variable the template uses as
 * unused, so its output cannot be trusted here.
 *
 * `astro check` covers types; this covers what a type checker cannot see, such
 * as an import that is never used.
 */
export default [
  {
    ignores: [
      // The simulation files are produced by an external tool and are never
      // edited here, so they are not ours to lint.
      'example-simulations/**',
      '.scratch/**',
      // Generated output, none of it written by hand.
      'dist/**',
      'node_modules/**',
      // Astro regenerates this on every sync, so linting it only reports the
      // tool's own generated type definitions.
      '.astro/**',
    ],
  },

  js.configs.recommended,
  ...ts.configs.recommended,
  ...astro.configs.recommended,

  {
    files: ['**/*.astro'],
    rules: {
      // Destructuring a field away to drop it, as in
      // `({ fileLevel: _fileLevel, ...entry }) => entry`, otherwise reads as an
      // unused variable. The underscore is this project's convention for
      // "deliberately not used", so it is allowed by pattern rather than
      // silenced by name.
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],
    },
  },
];