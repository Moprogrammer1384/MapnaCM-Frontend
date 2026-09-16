# Repository Guidelines

## Project Structure & Module Organization
This is an Angular 18 application using TypeScript, SCSS, and the Metronic UI framework.
- `src/app/pages/`: page features, including user, role, and permission management.
- `src/app/modules/`: feature modules such as authentication, account, profile, chat, and internationalization.
- `src/app/core/`: shared models and HTTP interceptors.
- `src/app/_metronic/`: shared layout, components, and widgets; reuse these before adding UI primitives.
- `src/assets/`: media, theme Sass, CSS, and plugins. Global styles start in `src/styles.scss`.
- `src/environments/`: development and production configuration. Tests live beside source files as `*.spec.ts`.

## Build, Test, and Development Commands
Run commands from the repository root:
- `npm ci`: install dependencies from `package-lock.json`.
- `npm start`: start the development server at `http://localhost:4200/`.
- `npm run build`: create the production build in `dist/demo1`.
- `npm run watch`: rebuild using development settings when files change.
- `npm test`: run Jasmine tests through Karma in Chrome, watching for changes.
- `npm test -- --watch=false --browsers=ChromeHeadless`: run tests once without a visible browser.
- `npm run lint`: invoke the configured Angular ESLint target.
- `npm run rtl`: generate RTL styles using `rtl.config.js`.

## Coding Style & Naming Conventions
Follow `.editorconfig`: UTF-8, two-space indentation, final newlines, and single quotes in TypeScript. Use SCSS for component styles. Preserve strict TypeScript and Angular template checks.

Use kebab-case filenames such as `user-listing.component.ts`, PascalCase class names, and camelCase members. Component selectors use `app-` with kebab-case; directive selectors use the `app` prefix with camelCase. ESLint rules are in `.eslintrc.json`.

## Testing Guidelines
Use Jasmine and Angular TestBed for component and service tests. Add or update adjacent `*.spec.ts` files for behavior changes, covering relevant failure paths. Generate coverage with `npm test -- --watch=false --browsers=ChromeHeadless --code-coverage`; no minimum coverage threshold is configured. No end-to-end target is configured.

## Commit & Pull Request Guidelines
Recent history uses short descriptive subjects, such as `Adding user management`, without a consistent Conventional Commits prefix. Keep commits focused and subjects specific.

For pull requests, describe the problem and resulting behavior, link relevant issues, report validation results or blockers, and include screenshots for UI changes.

## Configuration & Security
Check environment-specific API settings before testing integrations. Production builds replace `environment.ts` with `environment.prod.ts`. Browser configuration is public; never store credentials or secrets there.
