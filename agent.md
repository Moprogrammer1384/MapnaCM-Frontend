# MapnaCM frontend: development context

Last studied: **2026-10-05 (Asia/Tehran)**.
Latest source reviewed: `52233c9` (`Plant type fix`), plus the Tag and Measurement Type UI changes below.

This is the project memory for development with Codex. Read it at the start of
each task, inspect the relevant current source, and update it after meaningful
changes or another project study. It complements [AGENTS.md](AGENTS.md).
The user's current request and verified source take precedence over older notes.
Never treat this file as a substitute for inspecting files that have changed.

## Working agreement and maintenance

- **User scope clarification (2026-10-04): Angular UI development only.** Build
  polished components/pages and their frontend interactions. Other team members
  implement backend services and databases after this work. Missing endpoints
  must not block UI delivery or lead to backend/database implementation.
- Reuse existing frontend integrations when appropriate. New pages can use
  frontend state or isolated mock data with clear models for later integration.
  Do not invent endpoints, require a backend/storage decision for a UI request,
  or add persistent browser storage unless requested or already established.
- Develop within the existing Angular and Metronic architecture. Match nearby
  screens, forms, navigation, icons, spacing, and responsive behavior.
- **Default design source:** `C:/Users/hafez/Documents/Mapna/Mapna-UIUX/customize`.
  Most requests convert a supplied HTML design into Angular. Build from scratch
  only when explicitly requested, still using existing Metronic content.
- **Standing theme restriction:** use existing Metronic CSS, scripts, components,
  utility classes, markup, and dependencies. Do not author custom CSS/SCSS,
  inline styles, or new handwritten JavaScript for styling or theme behavior,
  including when a request mentions styles/scripts. Angular component state,
  bindings, forms, validation, and integration glue remain part of UI conversion.
- Preserve the user's edits. Inspect `git status` and the relevant diff first.
- Read the page, its template/styles, module/route, service/models, and relevant
  tests before changing a feature. Follow calls into shared code when needed.
- Reuse existing shared components and directives before adding alternatives.
- Keep changes within the requested scope. Record unrelated findings here;
  do not silently turn a feature request into a general rewrite.
- Update the appropriate section of this file when a contract or decision changes.
  Add a dated entry to the maintenance log with validation and any remaining blocker.
- Keep credentials, tokens, personal data, and machine-specific secrets out of
  documentation and browser environment files.
- Do not assume a backend endpoint exists because its name fits a convention.
  Consult an existing contract only when needed to preserve an existing frontend
  integration; new UI does not require a backend contract before implementation.
- Component and Measurement now use the existing `AssetApiService`, following
  later repository changes. Their original browser-storage implementation has
  been removed. Preserve current frontend wiring; focus new work on Angular UI.

## Project identity and toolchain

MapnaCM is a frontend for a .NET backend (`Global.API`), built by adapting
Metronic 8 demo1. `package.json` still names the application `MOGSight`, version
`8.3.0`; the Angular project is `demo1`. The old README's Angular 13 description
is historical: current dependencies use Angular **18.1**, TypeScript **5.5**,
RxJS **7.8**, Bootstrap **5.3**, and ng-bootstrap **17**.

Most application features use NgModules. Some newer chart components and generated
chart wrappers are standalone; do not assume standalone components are absent.
Forms use both template-driven and reactive approaches; follow the feature's pattern.

TypeScript has `strict: true`; Angular has strict template and injection checks.
`strictPropertyInitialization` and `noImplicitReturns` are disabled. Preserve these
settings rather than relaxing type checks to make changes compile.

Conventions: UTF-8, two spaces, final newline, single quotes in TypeScript,
kebab-case filenames, PascalCase classes, `app-` component selectors, and
`app` camelCase directive selectors. Consult `.editorconfig` and `.eslintrc.json`.

## Commands and validation

Run commands from the repository root.

| Command | Purpose |
| --- | --- |
| `npm ci` | Install the locked dependencies when needed |
| `npm start` | Development server at `http://localhost:4200/` |
| `npm run build` | Production build in `dist/demo1` |
| `npm run build -- --configuration development` | Development build |
| `npm run watch` | Rebuild with development settings |
| `npm test -- --watch=false --browsers=ChromeHeadless` | Browser unit tests, once |
| `npm test -- --watch=false --browsers=ChromeHeadless --include=src/path/example.spec.ts` | Select tests; see compilation caveat below |
| `npm run lint` | Angular ESLint over TypeScript and HTML |
| `npx tsc --project tsconfig.spec.json --noEmit` | Check test TypeScript without launching Karma |
| `npm run verify:apache-echarts` | Verify generated charts, scripts, and resources |
| `npm run test:apache-echarts` | Chart browser tests using their existing isolated configuration |
| `npm run rtl` | Generate RTL theme CSS using `rtl.config.js` |

Tests are adjacent Jasmine specs and Angular TestBed tests. Karma loads global
jQuery and Select2; its test scripts do not mirror every production script.
There is no configured end-to-end target or minimum coverage threshold.

`src/test.ts` initializes Angular testing; the Angular CLI discovers specs and
supports `--include`. It does **not** use `require.context`. However,
`tsconfig.spec.json` includes all specs for TypeScript compilation, so an unrelated
type error can still block an `--include` run. If necessary, use a temporary
tsconfig extending it with only the relevant specs and `src/**/*.d.ts` in `include`,
and pass `--ts-config=<temporary-config>`. Remove the temporary file afterward.
Do not leave `fit`/`fdescribe` or weaken assertions to conceal failures.

Production defaults: initial bundle warning/error budgets are 2 MB / 5 MB;
component style warning/error budgets are 2 KB / 4 KB. Large styles should use
an appropriate global partial or be split into reusable components.

### Original study baseline on 2026-10-04

- `npm run build`: passed. Initial bundle approximately 2.70 MB, exceeding the
  warning budget. CSS optimization reported four skipped selector rules.
- `npm run lint`: passed across the project.
- `npm run verify:apache-echarts`: passed; 370 widgets/scripts, 92 local resource
  references, and five vendor references verified.
- `npx tsc --project tsconfig.spec.json --noEmit`: failed at
  `plant.component.spec.ts:110`: expected `createPlant` payload lacks
  `employerId` and `employerName` required by the current `PlantPayload`.
- The normal Component test command earlier in this session was blocked by the
  same Plant error. With an isolated test tsconfig, all **11** new Component page
  and storage tests passed in ChromeHeadless.
- No live authenticated API integration or full visual browser audit was performed
  during this study. Build success does not establish that every API screen works.

The later Tag change passed build/lint and 27 focused UI tests. The missing
`hierarchyLabel` in the Plant test fixture was corrected during the relationship-ID
change on 2026-10-05. Normal test TypeScript compilation now passes; see the latest
maintenance entry for focused browser validation.

## Source map and feature status

| Location | Responsibility and current state |
| --- | --- |
| `src/main.ts`, `src/app/app.module.ts` | Bootstrap, HTTP, translations, auth initializer, global providers |
| `src/app/core/` | Shared API models, query serialization, auth interceptor |
| `src/app/pages/routing.ts` | Lazy routes inside the authenticated layout |
| `src/app/pages/asset-taxonomy/` | Site, Plant/Plant Type, Unit, System, Asset, Component, Measurement management |
| `src/app/pages/user/` | Real MapnaCM user list, add/edit, activity toggle, delete, detail/audit view |
| `src/app/pages/role/` | Real role list/create; role detail still uses the vendor demo API |
| `src/app/pages/permission/` | Vendor demo API list/CRUD; detail component has no implementation logic |
| `src/app/pages/cm/vibration/` | Five routes; Time Domain has a sample chart, other four templates are empty |
| `src/app/pages/dashboard/`, `builder/` | Metronic demo dashboard and persisted layout builder |
| `src/app/modules/auth/` | Real login/profile restoration/revocation; registration and forgot-password placeholders |
| `src/app/modules/account/` | Real profile overview/update/avatar; other settings retain demo behavior |
| `src/app/modules/crud/` | Shared DataTables, modal, and confirmation wrapper |
| `src/app/modules/apps/chat/` | Demo conversations with local message state and simulated replies |
| `src/app/modules/profile/`, `wizards/` | Primarily template/demo screens |
| `src/app/modules/widgets-examples/` | Widget galleries, including the standalone Apache Charts gallery |
| `src/app/_metronic/` | Shared layout, icons, directives, theme DOM helpers, widgets |
| `src/app/_fake/` | Mixed legacy code: in-memory demo API plus services calling Keenthemes remotely |
| `src/app/graphify-out/` | Generated graph reports/caches; historical, not application source |
| `src/assets/` | Theme Sass, icons, media/plugins, generated Apache chart scripts/data/vendor files |
| `tools/` | Apache chart generation, resource download, and verification scripts |

The `_metronic` tree contains custom integrations (Select2 and Apache ECharts),
so it is not entirely untouched vendor code. Change shared theme behavior
carefully because many features depend on it. Leave generated graph output alone.

## Routing, layout, and navigation

`app-routing.module.ts` defines public `/auth` and `/error` lazy modules and the
authenticated empty-path route guarded by `AuthGuard`. `LayoutModule` supplies
`LayoutComponent`, which consumes the routes from `pages/routing.ts`.

Authenticated feature roots include `/dashboard`, `/builder`,
`/crafted/pages/profile`, `/crafted/account`, `/crafted/pages/wizards`,
`/crafted/widgets`, `/cm/vibration`, `/apps/chat`, `/apps/users`, `/apps/roles`,
`/apps/permissions`, and `/asset-taxonomy`.

Add a new feature root in `pages/routing.ts`; add pages within an existing
feature in that feature's child routes. The sidebar is hardcoded in
`_metronic/layout/components/sidebar/sidebar-menu/sidebar-menu.component.html`.
Login response `menus` are not currently used to generate navigation.

`LayoutService` and `LayoutInitService` use dark/light sidebar configurations,
CSS classes, and HTML attributes. A route can request a layout through route
data. `ScriptsInitComponent` initializes/reinitializes the `kt` menu, drawer,
toggle, sticky, and scroll helpers. Preserve required `data-kt-*` hooks.
Page titles and breadcrumbs are calculated from active sidebar/header markup
by `PageInfoService`; keep menu labels and `data-link` values meaningful.

## Backend contracts and environment

Development API base: `https://localhost:7064/api`.
Production API base is still `http://localhost:5245/api`, marked as a deployment
placeholder in `environment.prod.ts`. Production builds replace the development
environment. Both configurations set `isMockEnabled: false`.

Related local projects are outside this frontend repository:

- Backend: `../../BackEnd` (`Global.API/Modules/Identity` and `Modules/Asset`
  contain the relevant controllers).
- Static UI references: `../../Mapna-UIUX/customize`.

MapnaCM endpoints use `ApiEnvelope<T>` (`success`, optional `message`, `errors`,
and `data`). Business failures may be HTTP 200 with `success: false`.
Unwrap/check in services and surface failures through the observable error path.
User creation has an intentional exception: `data.canRedefine` lets the page
request confirmation and retry with `redefineIfExists: true`.

| Operation | Current frontend contract |
| --- | --- |
| Login/revoke | POST `/Authentication/Login`, `/Authentication/RevokeToken` |
| User list/detail | GET `/User/Get`, `/User/GetById?UserId=...` |
| User create/edit | POST `/User/Create`, PUT `/User/Edit` |
| Activity/password | POST `/User/SetActive`, `/User/ResetPassword` |
| User delete | DELETE `/User/Delete?Id=...` |
| Profile | GET `/User/Profile`, PUT `/User/UpdateProfile` with multipart `FormData` |
| Remove avatar | POST `/User/RemoveAvatar` |
| Employer candidates | GET `/User/GetUsersByRole?RoleId=Employer` |
| Roles | GET `/Role/GetAll`, POST `/Role/Add` with `roleName` |
| Taxonomy entities | GET `/<Entity>/GetAll`, POST `/<Entity>/Add`, PUT `/<Entity>/Update`, DELETE `/<Entity>/Delete?Id=...` |

Taxonomy entities using frontend API services are `Site`, `PlantType`, `Plant`,
`Unit`, `System`, `Asset`, `Component`, and `Measurement`. Component and
Measurement were migrated from browser storage by later repository changes.

`criteriaToHttpParams` serializes `QueryCriteria` to PascalCase query keys:
`Skip`, `Take`, `Filters[i].PropertyName/Operation/Value/LogicalOperator`, and
`Sorts[i].PropertyName/IsAscending`. The backend's contains enum spelling is
`Conatains`; preserve that wire spelling. Paginated data is `{ items, totalCount }`.
Identity IDs are strings; taxonomy IDs are numbers. Some older template models
(such as `UserModel.id`) still declare numeric IDs; check actual wire models
when extending them.

The backend enforces authorization. Asset mutations use
`MapnaSuperAdmin,MapnaAdmin`; the frontend sidebar and buttons are not currently
a complete role-based authorization UI.

## Authentication and session behavior

Reference files: `modules/auth/services/auth.service.ts`,
`services/auth-http/auth-http.service.ts`, `services/auth.guard.ts`, and
`core/interceptors/auth.interceptor.ts`.

- Auth storage key: `${environment.appVersion}-${environment.USERDATA_KEY}`.
  Current `appVersion` is `v8.2.4`. Changing it also changes the versioned layout keys.
- Login maps the backend token, refresh token, and access-token expiry into
  `AuthModel`, stores it, and fetches `/User/Profile` to populate the current user.
- `AuthService` performs token restoration in its constructor; the app initializer
  also waits for `getUserByToken()` before completing bootstrap.
- `AuthGuard` checks expiry, uses the current user when present, or restores the
  user asynchronously. Session watch automatically logs out at expiry.
- Logout stops the timer, removes stored auth, makes a best-effort token revocation
  request, and navigates to login with an optional return URL.
- The interceptor reads the token through `getStoredAuthToken()` without injecting
  `AuthService`. It resolves the service lazily through `Injector` on an API 401.
  Preserve this arrangement to avoid the documented NG0200 circular dependency.
- Bearer tokens are attached only to URLs starting with `environment.apiUrl`;
  external vendor API and asset requests do not receive them.
- Refresh tokens are stored/revoked; there is no automatic refresh-token renewal
  flow in the current frontend service.

## Two table patterns

### User management and legacy permission/role details

`<app-crud>` wraps `angular-datatables`, ng-bootstrap modals, and SweetAlert2.
Inputs include `datatableConfig`, route, modal `TemplateRef`, and reload emitter;
outputs include create/edit/delete. Action cells contain raw HTML and use
document-level event delegation with `data-action` and `data-id`.
Action buttons depend on whether outputs are observed. Search uses
`data-action="filter"`. Parent pages own form state and API mutations.

Users use server-side DataTables. `UserManagementService` maps pagination,
column sorting, and OR search across UserName, Email, FirstName, and LastName into
backend query criteria. User forms assign exactly one role **by role name**.
User detail displays real role information and audit actions. Role list instead
uses cards with a create modal; it does not use the table wrapper.

### Asset taxonomy

Taxonomy pages use shared `TablePagination<T>` from
`src/app/_metronic/shared/Pagination/table-pagination.ts` and Angular-rendered
tables. They do not use `<app-crud>`, despite matching DataTables styling/classes. Reuse this pattern
for taxonomy pages. `AssetApiService` requests up to 10,000 rows for client-side
search/filter/sort/paging; this is a current limit, not unlimited pagination.

`TablePagination<T extends object>` retains native row values, searches their text
representations, combines exact filters typed per field, supports
page sizes 10/25/50/100, and cycles default -> ascending -> descending -> default.
Sorting preserves the original row array. New searches/filters/sorts reset page 1.
Deletion prompts first; `onConfirmedDelete` delegates the mutation to the host.
Column keys use `Extract<keyof T, string>` and all nine column arrays use
`satisfies readonly TablePaginationColumn<RowType>[]`. Numbers sort numerically;
text retains numeric-aware ordering (including elevations such as `995 m`).
Null/undefined sort as blanks, first ascending and last descending. Null, undefined,
and empty-string filters clear a selection; zero and false are active filters.

Angular 18 computed signals cache the pipeline: row snapshots -> filtered rows ->
sorted rows -> current-page rows. Counts derive from filtering; page count,
page-number arrays and ranges use separate computed results. Getter `filtered`
retains its existing sorted-result meaning. Templates use cached `resultCount`
for counts/empty states; page/page-size changes reuse filtering and sorting.
All state reads are getters, with updates through `setRows`, `search`, `setFilter`,
`sortBy`, `setPageSize` and `goToPage`. `setRows` copies/freezes the scalar row
snapshots and array, preserves/clamps the page by default, and accepts
`{ resetPage: true }` for reloads that previously reset to page 1. Measurement
Type reloads and local deletion preserve/clamp the page. Rows/filters/results
are readonly to consumers; submit forms must continue using their own models.

Taxonomy forms use `NgForm`, required fields, `saving` guards, ng-bootstrap modal
templates, Metronic alerts, and refresh after successful mutation. Async updates
often call `ChangeDetectorRef.detectChanges()` to repaint within the shared layout.

## Taxonomy and employer inheritance

Navigation order: **Site -> Plant -> Unit -> System -> Asset -> Component -> Measurement**.
The relationship chain is Measurement -> Component -> Asset -> System -> Unit -> Plant -> Site.
Plant Type is managed as a second table on the Plant page.

- Site stores city/address/coordinates/location/elevation as strings.
- Plant selects numeric Site and Plant Type IDs and an Identity Employer user.
  Its payload contains `employerId` and the employer display-name snapshot.
- Plant candidate employers come from `getUsersByRole('Employer')`.
- Unit/System/Asset/Component/Measurement inherit the Plant employer via parent-ID maps.
- Employer options come from `AssetApiService.getEmployerOptions()` as `{ id, name }`.
  All six employer filters compare Identity user IDs with row `employerId`,
  retaining the Plant's employer-name snapshot for display. Missing employer IDs
  remain unassigned; names do not establish relationships.
- Unit/System/Asset/Component parent options use `{ id: number, label: string }`.
  Forms, edit restoration, and parent filters bind numeric IDs; labels are displayed
  and sorted only. Duplicate or changed labels do not change relationships.
  Explicit row interfaces retain numeric entity/parent IDs (including
  `UnitRow.plantId`) and nullable Identity employer IDs as `string | null`.
  Filters, edit restoration and delete calls use those native values directly;
  numeric form values go directly into API payloads.
- Component displays name, Tag, Asset label, and inherited employer. It loads real
  Asset/System/Unit/Plant metadata before loading saved component rows.

Component now loads and saves through `AssetApiService` (`getAllComponents`,
`createComponent`, `updateComponent`, `deleteComponent`). Its parent options use
Asset `hierarchyLabel`; rows use `assetLabel`. The former `ComponentStorageService`
has been removed. Hierarchy labels now run top-down and include city and Plant Type.

`MeasurementComponent` is routed at `/asset-taxonomy/measurement`, immediately
after Component in the sidebar. It matches the Component table/modals with Name,
Tag, Component Name, and Employer columns, search, filters, sorting, and pagination.
Its Component form selection and filter use numeric IDs, preserving distinct
components even when their display labels match. Parent labels include Asset
and System context, and employer information is inherited from the Plant.

Measurement now loads and saves through `AssetApiService` (`getAllMeasurements`,
`createMeasurement`, `updateMeasurement`, `deleteMeasurement`). Component options
use `hierarchyLabel` and rows use `componentLabel`. The former
`MeasurementStorageService` has been removed. Measurement defines a named
taxonomy record, not a live numeric reading or sensor data stream.

Measurement also manages **Measurement Types** in a second table, reusing the
Plant page's table/modal pattern. Both table containers use `col-12`, stacked
at full width on every breakpoint. Types have required Name and Unit fields
and support add/edit, search, sorting, pagination, and confirmed deletion. Each
Measurement add/edit form requires a numeric type ID and finite numeric Sensitivity
(zero, negative numbers, and decimals are accepted; no range was specified).
The main table displays Type, Unit, and Sensitivity after Tag and filters types by ID.
Current source (verified 2026-10-06) uses `AssetApiService` for Measurement Types:
GET `/MeasurementType/GetAll`, POST `/MeasurementType/Add`, PUT
`/MeasurementType/Update`, DELETE `/MeasurementType/Delete?Id=...`.
The former Measurement UI-state service is absent. This API migration preceded
the native-row refactor; the session-memory notes in older log entries are historical.
Measurement payloads already include numeric `measurementTypeId` and `sensitivity`.
`TaxonomyMeasurement` and its row retain nullable type ID, type name, unit, and
sensitivity for legacy records. Null cells render blank; required fields must be
selected/filled when editing those records. Type deletion failures are surfaced from
the API. These are verified frontend contracts, not verified live backend behavior.

Asset, Component, and Measurement have an optional free-text Tag field in their
shared add/edit modal and a sortable Tag column after Name. Rows retain tags as
`string | null` (absent tags normalize to null); Angular renders them blank and
edit forms normalize null to `''`, so existing records remain searchable and editable.
Frontend create/update payloads include `tag`; clearing it submits `''`. These are
frontend models/bindings only; backend/database work belongs to the other team.

## Profile and demo boundaries

Account overview and Profile Details use `ProfileService`. Profile editing sends
`FirstName`, `LastName`, `Email`, `PhoneNumber`, `Address`, and optional `Avatar`
in `FormData`. Avatar checks allow JPEG/PNG/WEBP up to 2 MB; save/removal refreshes
the shared auth user so the header updates.

Other account settings are template behavior: sign-in-method saves use timers,
and the deactivate component displays an alert rather than calling the backend.
Chat uses demo data and simulated replies. Permissions and role detail use
`_fake/services` pointing to `preview.keenthemes.com/starterkit/metronic/laravel/api/v1`.
Those services are real outgoing HTTP calls, not local canned responses.
Do not assume screens are integrated based solely on where their files live.

## Select2, styles, theme, and localization

`SharedModule` exports Keenicons and `Select2Directive`. Selects with
`data-control="select2"`, `data-kt-select2="true"`, or `appSelect2` are automatically
enhanced. The directive preserves Angular value accessors, numeric `[ngValue]`,
validation, model changes, and asynchronously loaded options.

It uses global `window.jQuery`, attaches dropdowns within nearby modals/menus,
syncs selection changes, observes option changes, and cleans up on destroy.
Do not initialize those selects again in page code or use another jQuery instance
for the plugin. See `_metronic/shared/select2/README.md` for attributes and examples.

`angular.json` loads Select2/DataTables CSS and global jQuery/Select2/DataTables JS.
`src/styles.scss` imports theme Sass, plugins, Angular vendor styles, and three
Keenicon font styles. Use `<app-keenicon>` and existing Metronic utility classes.
RTL CSS is generated separately and enabled by changing the stylesheet imports.

Theme mode uses `data-bs-theme` and storage keys `kt_theme_mode_value` and
`kt_theme_mode_menu`. Layout config uses versioned `layoutConfig` and
`baseLayoutType` keys. Translations use ngx-translate with en/ch/es/jp/de/fr vocabularies;
selected language uses `language`. Many custom page labels are currently English.

## Apache ECharts and vibration

Reusable chart host:
`_metronic/partials/content/widgets/charts/Apache-Echarts/apache-echarts.component.ts`.
It is standalone; import it in NgModule `imports` or a standalone component's
`imports`. Supports `options`, `initializer`, `demoId`, canvas/SVG renderer, height,
theme, and chart init/render/error events.

The host runs chart work outside Angular, observes resize, loads demo scripts and
required local dependencies, renders example controls, and disposes charts,
listeners, timers, and initializer cleanup on destruction/reinitialization.
Keep this lifecycle intact when changing chart behavior.

The `/crafted/widgets/apache-charts` gallery uses a generated registry and
370 standalone wrappers under `Apache-Widgets`. IntersectionObserver delays
chart activation until near the viewport. Generated JS/catalog/data/vendor assets
live in `src/assets/apache-echarts`. Seven Baidu Maps examples are excluded.
Source examples are pinned to commit `aebd221b302308af240b90267fd43b81657099a1`.

Regenerate with `tools/generate-apache-echarts.mjs` and the matching source/data;
use `tools/fetch-apache-echarts-assets.ps1` for resource acquisition. Follow the
chart README and run verification/browser checks when changing the integration.
Do not manually rewrite generated wrappers for a new application chart; pass
application `EChartsOption` data to the reusable host.

Vibration routes: overview, time-domain, frequency-domain, bode-analysis,
rotor-position. Only Time Domain currently has content: a synthetic 10 Hz + 25 Hz
velocity signal over two seconds with tooltip and zoom. It is sample data,
not a connected condition-monitoring backend feed.

## Porting a static Mapna-UIUX page

This is the normal workflow for this project. The default reference directory is
`C:/Users/hafez/Documents/Mapna/Mapna-UIUX/customize` (`../../Mapna-UIUX/customize`
from this repository). It uses `customize/<page>.html`, `_template.html`, and
occasionally matching JavaScript (currently `siteplant.js` is present).

1. Read the requested design and compare its dependencies with `_template.html`.
2. Port only page content inside `#kt_app_content_container`; Angular supplies
   the header/sidebar/footer. Content markers vary, so inspect the actual HTML.
3. Reuse the design's existing Metronic styles, scripts, content, and dependencies.
   Preserve required existing assets and load them only when needed; do not
   introduce a new styling system, UI library, custom styles, or handwritten JS.
4. Convert icon markup to Keenicons components and preserve required theme hooks.
5. Adapt markup, state, bindings, forms, and validation to Angular. Integrate
   existing theme behavior through lifecycle hooks with cleanup; do not rewrite
   it with newly invented JavaScript or initialize a plugin twice.
6. A request for a blank page means route/module/menu scaffolding and empty content;
   add design content only when requested. Build a page from scratch only when
   the user explicitly requests it, using the same existing theme capabilities.

Read the sibling project's own instructions before editing it; this frontend
study does not authorize unrelated changes in that project or the backend.

## Corrections to older guidance

- `CLAUDE.md`: "most reads are POST" is outdated for User/Profile and taxonomy.
  Use the endpoint table and actual services/controllers.
- `CLAUDE.md`: `_fake` services do not all return canned data; several call a
  remote vendor API even with `isMockEnabled: false`.
- `CLAUDE.md`: tests no longer use `require.context`; CLI `--include` exists,
  with the separate TypeScript compilation caveat above.
- `CLAUDE.md`: "no standalone components" predates the ECharts integration.
- `README.md`: Angular 13 and end-to-end instructions do not describe current setup.
- `employers.ts`: employer persistence is now supported in Plant API payloads;
  legacy fallback helpers remain in use.

## Study coverage and maintenance log

The review covered root guidance/configuration, bootstrap/auth/session handling,
route/layout/navigation, shared models/services, user/role/permission behavior,
all taxonomy levels, profile editing, demo modules, Select2, the ECharts host and
gallery/generator boundaries, styles/localization, test setup, and sibling backend
controller/design references. Vendor/demo screens were inspected by structure and
representative implementation; generated chart files were validated by the
repository verifier. This is development context, not a line-by-line audit of
every vendored asset or generated graph report.

### 2026-10-04 — initial project study

- Read `CLAUDE.md` and compared its guidance with current source.
- Created this file and added the read/update rule to `AGENTS.md`.
- Recorded the explicit browser-storage decision for Component.
- Verified build, lint, chart generation consistency, and the existing test
  compilation blocker. See the baseline section for exact results.
- Application source and backend code were not changed during this study.

### 2026-10-04 - Measurement page

- Added `/asset-taxonomy/measurement` after Component in the module and sidebar.
- Reused the Component page layout, table, Select2, form, alert, and confirmation
  patterns; Measurement links to Component and uses separate browser storage.
- Component selections and filters use IDs to handle identical display labels.
- Production build and project lint passed. Existing bundle/CSS warnings remain.
- All 24 focused tests passed in ChromeHeadless: 13 Measurement page/storage tests
  and 11 Component regression tests. Used an isolated temporary test tsconfig to
  avoid the previously verified unrelated Plant test compilation error, then
  removed that configuration. Live authenticated API integration was not tested.

### 2026-10-04 - UI development scope clarified

- The user specified that this agent builds Angular UI components/pages;
  backend and database implementation follow separately with other team members.
- Updated this working agreement and `AGENTS.md` so future UI tasks proceed
  without depending on backend availability or requesting backend decisions.
- Existing Component/Measurement storage was not changed by this clarification.

### 2026-10-04 - Template conversion and theme restrictions clarified

- The user established `Mapna-UIUX/customize` as the usual source of HTML designs
  to convert to Angular; building pages from scratch is the less common explicit request.
- Reuse existing Metronic content, CSS, JS behavior, and dependencies. Do not write
  custom styles or handwritten JavaScript for UI/theme behavior.
- Updated `AGENTS.md`, the working agreement, and the page-porting workflow.

### 2026-10-04 - Tags for Asset, Component, and Measurement

- Added an optional Tag column after Name and a Tag Name input in each add/edit
  modal, reusing existing Metronic markup and utility classes.
- Tags participate in table search/sorting, populate when editing, and reset for
  new records. Missing/null tags display as empty strings; users can clear a tag.
- Updated frontend row/form models and create/update payloads with `tag`.
  Backend/database files, theme styles, and theme scripts were not changed.
- Refreshed this project map against current source: Component and Measurement
  now use the existing API service; their earlier storage services were removed
  by intervening repository changes.
- Production build and project lint passed. Existing bundle/CSS warnings remain.
- All 27 focused ChromeHeadless tests passed, including 12 Tag cases across all
  three pages and 15 existing Component/Measurement regression cases. Used a
  temporary isolated test tsconfig and removed it after verification.
- The standard test compilation is blocked by existing Plant fixtures missing
  `hierarchyLabel` in `plant.component.spec.ts:38-40`. Live API tag persistence
  was not tested; backend integration remains with the backend team.

### 2026-10-05 - Measurement Types and Sensitivity

- Reused the Plant reference/table/modal layout and existing Metronic utilities,
  Select2 integration, and `ClientTable`. Added a second Measurement Type table
  with required Name and Unit, plus the Measurement Type selection and required
  numeric Sensitivity in the shared Measurement modal.
- Added Type, Unit, and Sensitivity columns, a type filter, read-only selected Unit,
  immediate label updates when editing types, and deletion protection for used types.
- New data uses isolated session memory as described above; retained existing
  Measurement API payloads/operations. Backend/database, styles, theme scripts,
  routes, and browser storage were not changed.
- Production build and project lint passed. Existing initial bundle warning
  (approximately 2.70 MB against 2 MB) and four CSS selector warnings remain.
- All **43 focused ChromeHeadless tests passed**: Measurement UI/state, Component
  regression, Tag regression for all three pages, and ClientTable behavior.
  Used an isolated temporary test tsconfig to bypass the existing Plant fixtures
  missing `hierarchyLabel`, then removed it. Full test TypeScript compilation
  still reproduces that unrelated Plant error.
- Verified dialog/template behavior with mocked APIs in ChromeHeadless. Live
  authenticated API integration and a manual visual browser audit were not performed.
  New Type/Sensitivity persistence remains frontend session memory, not backend storage.

### 2026-10-05 - Measurement tables at full width

- Changed both Measurement and Measurement Type table containers to `col-12`,
  as requested, so they stack at full width on every breakpoint.
- Verified both wrapper classes in the source and passed `git diff --check`.
  This changes two layout classes only; build and behavior tests were not rerun.

### 2026-10-05 - Measurement service injection review

- Checked the `MeasurementComponent` constructor: `MeasurementUiStateService`
  is imported as a class and declares `@Injectable({ providedIn: 'root' })`.
  No additional module provider is required for the current registration.
- `npx ngc -p tsconfig.app.json --noEmit` passed, including strict Angular
  injection checks. No application source was changed during this review.
  The subsequent NG2003 report and explicit token change are recorded below.

### 2026-10-05 - Explicit Measurement injection token

- The user supplied an IDE NG2003 diagnostic stating that `uiState` has no
  runtime injection token. The on-disk service is a normal exported injectable
  class with a value import; the project Angular compiler passed before the change.
- Editor logs verified Angular Language Service 22.2.0 and TypeScript 6.0.3,
  while installed project Angular core/compiler are 18.2.14. The editor also
  logged failures to resolve the Measurement template's component. These
  suggest editor resolution/state issues; their exact cause is not established.
- Added `@Inject(MeasurementUiStateService)` to the constructor parameter and
  split the runtime service import from `import type { MeasurementType }`.
  Root service scope and Measurement behavior are unchanged. Restarting the
  Angular language server may still be needed to refresh editor diagnostics.
- `npx ngc -p tsconfig.app.json --noEmit`, project lint, and all **19** focused
  Measurement UI/state ChromeHeadless tests passed. Removed the temporary
  isolated test config. Editor diagnostic clearance has not been verified.

### 2026-10-05 - Shared table pagination helper

- Studied `ClientTable`: it owns in-memory pagination, case-insensitive search,
  exact column filters, three-state sorting, column metadata and SweetAlert2
  delete confirmation/delegation. It is a TypeScript helper, not an Angular component.
- Renamed it to `TablePagination` and its column interface to
  `TablePaginationColumn`; moved implementation and adjacent tests into
  `src/app/_metronic/shared/Pagination/`. Updated all seven page imports and
  nine table instances: Site, Plant/Plant Type, Unit, System, Asset, Component,
  and Measurement/Measurement Type. Behavior and template bindings are unchanged.
- Production build and project lint passed. Existing 2.70 MB bundle-budget and
  four CSS selector warnings remain. No stale imports remain in application source;
  historical generated graph reports were left intact.
- Isolated ChromeHeadless validation: **35 of 36 tests passed**, including all
  five helper tests plus Component, Measurement and Tag checks. The Measurement
  type-creation test at `measurement.component.spec.ts:229` expects a selected
  unit after opening a blank form without selecting a type; the same failure
  was reproduced by mapping page imports to the original pre-refactor helper.
- Full test TypeScript compilation still fails on the existing Plant fixture
  missing `hierarchyLabel`. Temporary baseline source/configuration were removed.
  Live API integration and manual browser verification were not performed.

### 2026-10-05 - Taxonomy relationships use IDs

- Implemented the first clean-code review recommendation only: Unit, System,
  Asset, and Component form selections/edit restoration and parent filters now
  bind numeric IDs. Removed all four label-to-ID lookup maps; option labels and
  backend parent labels remain presentation data. Unavailable IDs are rejected.
- Plant through Measurement employer filters now bind Identity user IDs. Parent
  traversal carries both employer ID and display name, preserving the Plant's
  name snapshot without inferring an assignment from its text.
- Existing numeric Site/Plant Type and Measurement Component/Type selections,
  API endpoints/payload contracts, shared Select2 and TablePagination behavior,
  theme markup/styles and storage choices were retained.
- Added 32 template/Select2 regression checks across six pages for duplicate
  parent/employer labels, differing saved/current labels, filter clearing,
  numeric create/update IDs, unavailable parents, and missing employer IDs.
  Updated existing Component/Measurement assertions to use employer IDs.
- Corrected two pre-existing test issues: added required Plant `hierarchyLabel`
  fixture data and selected the new Measurement Type before asserting its unit.
- Verified: production build, project lint, normal test TypeScript compilation,
  and all **73** focused taxonomy/pagination ChromeHeadless tests passed. Existing
  2.70 MB initial bundle-budget and four CSS selector warnings remain.
  Live authenticated backend integration was not tested; API calls were mocked
  in browser tests. Full heterogeneous table-row typing is a separate follow-up.

### 2026-10-06 - Authentication picture column on mobile

- Changed the shared Auth template's picture/marketing aside from `d-flex` to
  `d-none d-lg-flex`, reusing existing Metronic/Bootstrap display utilities.
  It is hidden below the theme's 992px desktop breakpoint; the form remains
  visible and the desktop two-column layout is retained. This shared template
  also wraps registration and forgot-password pages.
- Verified the theme breakpoint/display utility definitions and passed
  `npx ngc -p tsconfig.app.json --noEmit`, `npm run lint`, and `git diff --check`.
  No custom styles or scripts were added. Manual browser verification and a
  production build were not performed for this single-class change.

### 2026-10-06 - Native taxonomy rows and typed TablePagination

- Inspected all seven pages/nine table instances, row mappers, consumers,
  templates, column definitions, API models/service and existing focused tests.
  Replaced string-record row models with explicit interfaces. Entity and parent
  IDs remain numbers; Identity employer IDs remain nullable strings. Measurement
  type ID and sensitivity remain `number | null`; nullable type/unit/tag values
  stay nullable. `UnitRow.plantId` is explicitly declared as a number.
- Generalized the helper to object rows with string-only declared column/sort
  keys, readonly column input and per-field filter types. All column definitions
  use `satisfies`. Search converts to text only for comparison. Numeric sorting,
  blank/null ordering, numeric-aware elevation ordering, three-state sorting,
  original row order, pagination and confirmation/delegation remain covered.
- Component and Measurement mappers use the existing `TaxonomyComponent` and
  `TaxonomyMeasurement` contracts. Removed redundant row/filter/edit/delete ID
  conversions; kept HTTP query serialization and DOM page-size conversion.
  Typed search/page-size template references replace `$any` event-target access.
  API models, endpoints and submitted payload formats were not changed.
- Added five helper checks (including negative compile-time key/filter checks),
  two legacy-null/zero Measurement cases and eight Site/Unit/System/Asset UI
  regressions. Updated existing native-value expectations. No permissive row
  index signatures, new application `any` types or unsafe type casts were added.
- Verified: `npx ngc -p tsconfig.app.json --noEmit`, normal
  `npx tsc -p tsconfig.spec.json --noEmit`, production build, project lint,
  `git diff --check`, and all **54** focused ChromeHeadless tests (taxonomy,
  TablePagination and Select2) passed. Existing 2.70 MB initial-bundle budget
  warning and four CSS selector warnings remain. API calls were mocked in tests;
  live backend integration and a manual browser audit were not performed.

### 2026-10-06 - Cached TablePagination derivations

- Inspected the plain TypeScript helper, all seven consumer pages/nine tables,
  their table templates, state writes and focused tests. Confirmed installed
  Angular core 18.2.14 supports `signal`/`computed` in this helper without DI.
- Added private input signals and separate computed filtering, sorting, result
  count, page count, valid current page, page-number array, page slice and ranges.
  Repeated reads reuse cached results. Only the affected stages recompute;
  metadata/count reads do not trigger sorting, and page/size changes do not
  filter or sort. Sorting copies filtered rows rather than altering input order.
- Replaced consumer row/page assignments with `setRows`, preserving each page's
  reset policy. Readonly frozen scalar-row snapshots isolate input mutations;
  filters are updated immutably through `setFilter`. Templates use cached
  `resultCount` for entry counts and empty states. Kept typed native fields,
  global search, exact filters, three-state sorting, confirmation callbacks,
  and submitted API formats. Invalid page/size inputs leave state unchanged.
- Added **11** cache regression tests for result identity and operation counters,
  dependency invalidation, page/size-only updates, repeated equal inputs,
  snapshot isolation, empty results, shrink/grow/reset behavior and local deletion.
  Assertions compare identity as booleans so Jasmine's object formatting cannot
  invoke the search/comparison probes and contaminate counters.
- Verified strict Angular compilation, normal test TypeScript compilation,
  production build, project lint, `git diff --check`, and all **65** focused
  ChromeHeadless tests (taxonomy, pagination and Select2) passed. Existing initial
  bundle warning (2.70 MB against 2 MB) and four CSS selector warnings remain.
  No browser performance benchmark or live backend integration was performed.
