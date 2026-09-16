# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start                  # ng serve on http://localhost:4200 (development configuration)
npm run build              # production build -> dist/demo1
npm run watch              # rebuild on change, development configuration
npm test                   # Karma + Jasmine in Chrome, watch mode (singleRun: false)
npm run lint               # @angular-eslint over src/**/*.ts and src/**/*.html
npm run rtl                # webpack (rtl.config.js) compiles assets/sass/style.scss -> assets/css/style.rtl.css
```

`src/test.ts` loads every `*.spec.ts` via `require.context`, so there is no per-file test script. To run a single spec, temporarily narrow the regex in `src/test.ts` or focus with `fdescribe`/`fit`.

TypeScript is `strict` with `strictTemplates`; `strictPropertyInitialization` and `noImplicitReturns` are off (the template code relies on that).

## What this project is

A Metronic 8 "demo1" Angular admin template (Keenthemes, module-based NgModules — no standalone components) that is being converted into the **MapnaCM** front end against a .NET backend (`Global.API`). Most of the tree is still untouched vendor demo code; the MapnaCM work lives in a few specific places. Knowing which is which matters before editing:

- **Vendor / template, edit sparingly**: `src/app/_metronic/**`, `src/assets/sass/**`, `src/app/modules/{profile,wizards,widgets-examples,errors,i18n}`, `src/app/pages/builder`.
- **MapnaCM application code**: `src/app/core/**`, `src/app/pages/{user,role,permission}`, `src/app/modules/auth/services`, `src/app/modules/account/services`, `src/app/modules/apps/chat`.
- **Demo data still in use**: `src/app/_fake/**`. The permission pages and `role-details` still read from `_fake/services/*`; users and the roles list have been moved to the real API. `environment.isMockEnabled` is `false`, so the in-memory web API is not registered — the `_fake` services that are still wired in return canned data directly.
- `src/app/graphify-out/` is generated tool output (code-graph analysis), not application code. Don't edit it; it goes stale after commits.

## Backend contract

`environment.apiUrl` points at the MapnaCM API (`https://localhost:7064/api` in dev; `environment.prod.ts` still has a placeholder localhost URL).

Two rules govern every HTTP call, and both are easy to get wrong:

1. **Every endpoint returns `Response<T>` (`ApiEnvelope<T>` in [response.model.ts](src/app/core/models/response.model.ts))** — `{ success, message, errors, data }`. Business failures (wrong password, inactive account) come back as **HTTP 200 with `success: false`**, so services must branch on `success`, never on the HTTP status. The established pattern is to `map` in the service and `throw new Error(response.message || '<fallback>')`, letting the component's `error` callback handle it.
2. **Most endpoints are POST**, including reads (`User/Get`, `User/GetById`, `User/Profile`). `Role/GetAll` is one of the few GETs.

List endpoints take `QueryCriteria` (`filters` / `sorts` / `skip` / `take`). [user-management.service.ts](src/app/pages/user/services/user-management.service.ts) is the reference for translating DataTables server-side parameters into that shape and back into `{ recordsTotal, recordsFiltered, data }`. Note the backend's `Operator` enum misspells contains as `Conatains` — the union type in [user-management.model.ts](src/app/core/models/user-management.model.ts) accepts both spellings.

## Auth flow

- `AuthModel` (token, refreshToken, expiresIn) is persisted in localStorage under `` `${environment.appVersion}-${environment.USERDATA_KEY}` ``. **Bumping `appVersion` invalidates every stored session and layout config**, since the layout keys are versioned the same way.
- `APP_INITIALIZER` in [app.module.ts](src/app/app.module.ts) blocks bootstrap on `authService.getUserByToken()`, so `AuthGuard` can read `currentUserValue` synchronously.
- [auth.interceptor.ts](src/app/core/interceptors/auth.interceptor.ts) deliberately reads the token through the free function `getStoredAuthToken()` instead of injecting `AuthService`, and resolves `AuthService` lazily via `Injector` only inside `catchError`. `AuthService` fires an HTTP request on itself in its constructor; injecting it into the interceptor causes NG0200. Keep that indirection.
- The interceptor only attaches the bearer token to URLs starting with `environment.apiUrl`, and logs out on 401 from those URLs.
- Registration and forgot-password have no backend endpoints yet; those `AuthHTTPService` methods still point at placeholder paths.

## Routing and layout

Three top-level routes in [app-routing.module.ts](src/app/app-routing.module.ts): `auth`, `error`, and everything else behind `AuthGuard` into `LayoutModule`. The authenticated route table is **[src/app/pages/routing.ts](src/app/pages/routing.ts)**, pulled in as the children of `LayoutComponent` — add new authenticated pages there, not in `app-routing.module.ts`.

The Metronic chrome is config-driven: `LayoutService` merges `dark-sidebar.config.ts` / `light-sidebar.config.ts` (see [configs/config.ts](src/app/_metronic/layout/core/configs/config.ts) for the `ILayout` shape) and pushes CSS classes/HTML attributes into `LayoutComponent`. A route can request a layout via `data: { layout: 'light-sidebar' }`. `LayoutInitService` plus the `kt/` classes (`MenuComponent`, `DrawerComponent`, `ScrollComponent`, …) are imperative DOM helpers ported from the HTML theme — they attach on `data-kt-*` attributes in templates, not through Angular bindings, so changing markup can silently break behavior.

Sidebar navigation is hardcoded in [sidebar-menu.component.html](src/app/_metronic/layout/components/sidebar/sidebar-menu/sidebar-menu.component.html); the login response carries a `menus` field that is not consumed yet.

## CRUD page pattern

Admin list pages (users, roles, permissions) all follow the same shape, and new ones should:

- `<app-crud>` ([crud.component.ts](src/app/modules/crud/crud.component.ts)) wraps `angular-datatables` + an ng-bootstrap modal + SweetAlert2 confirm. It takes `datatableConfig`, a `reload` `EventEmitter`, a `TemplateRef` modal, and emits `createEvent` / `editEvent` / `deleteEvent`.
- It appends its own "Actions" column whose buttons are raw HTML strings; clicks are caught by a **document-level `Renderer2` listener** reading `data-action` / `data-id`. Row ids may be numbers (demo services) or GUID strings (MapnaCM). Edit/delete buttons only render if the parent subscribes to the matching output (`.observed`).
- Filtering is a document-level `keyup` listener on `[data-action="filter"]`, not an Angular binding.
- The page component owns the form model and calls the API service; see [user-listing.component.ts](src/app/pages/user/user-listing/user-listing.component.ts).

Because of the `OnPush`/detached-datatable interplay, these components inject `ChangeDetectorRef` and call `detectChanges()` after async updates — follow that or rows won't repaint.

## Styling and assets

jQuery, DataTables, Bootstrap 5 and the Metronic SCSS are loaded globally via `angular.json` (`scripts` + `styles`); jQuery is a real global, `$` is available in components. Global styles come from `src/styles.scss`, which imports the theme SCSS from `src/assets/sass/`. The production build caps any single component stylesheet at 4 KB (`anyComponentStyle` budget) — large per-component SCSS fails the build.

Icons come from Keenicons through `<app-keenicon name="..." type="duotone|outline|solid">` ([SharedModule](src/app/_metronic/shared/shared.module.ts)).

i18n uses `@ngx-translate` with vocabularies registered in `AppComponent` from `src/app/modules/i18n/vocabs/`; the selected language is stored in localStorage under `language`. RTL is opt-in: run `npm run rtl`, then swap the imports in `src/styles.scss`.

## Conventions

- Component selectors: `app-` prefix, kebab-case; directives: `app` prefix, camelCase (enforced by eslint).
- Components default to SCSS; `ng generate` is configured accordingly.
- API services live next to the feature (`pages/<feature>/services/`), wire models shared across features go in `src/app/core/models/`.
- CommonJS deps must be listed in `allowedCommonJsDependencies` in `angular.json` or the build warns.
