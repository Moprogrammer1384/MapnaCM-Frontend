# Repository Guidelines

The project name is **DARP** (confirmed by the user on 2026-10-10). Use this name in project documentation and application metadata.

## Project Memory

- At the start of each task, read [agent.md](agent.md) for the project map, established decisions, and current validation notes, then inspect the live source relevant to the request.
- Keep `agent.md` current after development or a project study: update changed architecture, API contracts, storage decisions, and validation results. Date the entry and distinguish verified behavior from assumptions and untested integrations.
- `CLAUDE.md` is historical guidance. Where it differs from current source, use the verified corrections recorded in `agent.md`. Preserve the user's existing work and keep changes focused on the requested task.

## Development Scope

- The user's explicit scope is Angular UI: build complete, polished components and pages. Other team members implement the backend and database afterward.
- Missing backend endpoints must not block UI work or trigger backend implementation or database changes. Do not ask the user to choose a backend approach for a UI-only request.
- Reuse existing frontend integrations where relevant. For new UI without an API, use frontend state or clearly separated mock data, following the established page pattern. Keep models and data access easy for the backend team to connect later; do not invent an API contract or add persistent browser storage unless requested or established for that page.

## UI Source and Metronic Requirements

- Most page requests port an existing HTML design from `C:/Users/hafez/Documents/Mapna/Mapna-UIUX/customize`. Read the specified HTML and its existing CSS/JS dependencies before converting it into an Angular component. Build a page from scratch only when the user requests that.
- Use existing Metronic content, layout primitives, utility classes, CSS, JavaScript behavior, and dependencies. Preserve the reference design and interactions while adapting markup, bindings, forms, and lifecycle integration to Angular.
- **Mandatory Styling Policy — METRONIC ONLY (2026-10-10):** follow the full [policy in agent.md](agent.md#mandatory-styling-policy--metronic-only). It takes precedence over conflicting older styling/library restrictions. Metronic is the only visual design system; PrimeNG and Spartan UI are permitted only as functionality/behavior providers with their default visuals disabled or reliably replaced.
- Reuse Metronic patterns, templates/classes, tokens, and styling APIs. Centralized Metronic-token-based adapter styling is permitted; reusable adapters belong in `src/app/shared/components/`. Preserve Metronic light/dark themes, responsive behavior, accessibility, and hover/focus/disabled/loading/error states; verify visual consistency and absence of regressions before completion.
- Do not use PrimeNG default themes/presets, Spartan default visual styles, independent palettes, arbitrary Tailwind values, competing component visuals, fragile global CSS overrides, modified third-party sources, or copied styles without checking Metronic tokens. If a library cannot reliably disable or replace its default styling, stop, explain the limitation, and request approval before proceeding.
- Port page content only; the Angular layout supplies the shared chrome. Reuse already loaded dependencies and existing theme scripts without duplicate plugin initialization. Angular TypeScript for component state, bindings, validation, and integration is part of the conversion; it must not replace existing theme behavior with a newly invented implementation.

## Project Structure & Module Organization
This is an Angular 18 application using TypeScript, SCSS, and the Metronic UI framework.
- `src/app/pages/`: page features, including user, role, and permission management.
- `src/app/modules/`: feature modules such as authentication, account, profile, chat, and internationalization.
- `src/app/core/`: shared models, services, and HTTP interceptors.
- **Service location rule (2026-10-10): services must be placed under `src/app/core/services/`.** Do not create service implementations in page folders; import them from this central directory.
- **Reusable component location rule (2026-10-10): from now on, every reusable component must be placed under `src/app/shared/components/`.** Create or extract reusable components into this directory, using a feature subfolder when needed; page-specific components remain with their pages.
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
