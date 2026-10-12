# DARP frontend: development context

Last studied: **2026-10-11 (Asia/Tehran)**, focused on taxonomy hierarchy and mutation helpers.
Latest focused maintenance: **2026-10-12**.
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
- **Mandatory styling policy (2026-10-10):** follow the METRONIC ONLY policy below.
  It supersedes conflicting older styling/library restrictions. Reuse Metronic
  patterns first; PrimeNG and Spartan UI may supply functionality/behavior only.
  Centralized Metronic-token-based adapter styling and supported styling APIs are
  permitted by this policy; independent visual systems are prohibited. Angular
  state, bindings, forms, validation, and integration remain part of UI conversion.
- Preserve the user's edits. Inspect `git status` and the relevant diff first.
- Read the page, its template/styles, module/route, service/models, and relevant
  tests before changing a feature. Follow calls into shared code when needed.
- Reuse existing shared components and directives before adding alternatives.
- **Service location rule (2026-10-10): services must be placed under
  `src/app/core/services/`.** Do not create service implementations in page folders;
  import them from this central directory. Asset taxonomy uses
  `src/app/core/services/asset-taxonomy-api.service.ts`.
- **Reusable component location rule (2026-10-10): from now on, every reusable
  component must be placed under `src/app/shared/components/`.** Create or extract
  reusable components into this directory, using a feature subfolder when needed.
  Page-specific components remain with their pages. Existing reusable components
  in `_metronic/` are retained integrations, not the placement pattern for future
  reusable components. The data-table was migrated from `custom-components/`
  into `shared/components/` on 2026-10-10.
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

## Mandatory Styling Policy — METRONIC ONLY

Adopted on **2026-10-10** from the user's instructions. This policy takes priority
over conflicting older guidance in `agent.md`, `AGENTS.md`, `CLAUDE.md`, and
historical maintenance entries. Other non-conflicting project rules remain active,
including the service and reusable-component location rules.

### 1. Single Source of Truth

Metronic is the ONLY authorized visual design system for the entire DARP application.

All UI components MUST follow Metronic's visual design, regardless of their implementation source.

PrimeNG and Spartan UI are permitted ONLY as component functionality/behavior providers.

Their default visual styles MUST NOT be used.

### 2. External Component Styling

When using PrimeNG or Spartan UI:

- Disable or avoid the library's default styling.
- Use unstyled/headless modes where supported.
- Apply Metronic design tokens and CSS conventions.
- Match existing Metronic components visually.
- Preserve Metronic typography, colors, spacing, sizing, borders, radii, shadows and focus states.
- Support existing Metronic light/dark themes.
- Preserve responsive and accessibility behavior.

### 3. Styling Restrictions

STRICTLY PROHIBITED:

- Using PrimeNG default themes or presets.
- Using Spartan UI default visual styles.
- Introducing independent color palettes.
- Using arbitrary Tailwind utility values.
- Creating competing button, input, dialog, dropdown or table visual styles.
- Applying fragile global CSS overrides.
- Modifying third-party library source code.
- Copying styles without checking Metronic tokens.

### 4. Styling Implementation

Preferred approach:

1. Find the equivalent Metronic component or visual pattern.
2. Extract its existing styling conventions.
3. Use the selected library for functionality.
4. Apply Metronic-compatible templates/classes, tokens, and styling APIs.
5. Create reusable adapters when necessary.
6. Keep styling centralized and maintainable.

If a library does not support disabling or replacing its default styles reliably:

- STOP.
- Explain the styling limitation to the user.
- Request approval before proceeding.

### 5. Visual Acceptance Criteria

A component is NOT complete unless:

- It visually matches the existing Metronic UI.
- No original PrimeNG/Spartan theme is visible.
- Light/dark modes work where applicable.
- Hover, focus, disabled, loading and error states are consistent with Metronic.
- Responsive behavior is verified.
- Accessibility is preserved.
- No styling regression exists elsewhere.

Any violation is considered a UI architecture defect.

## Project identity and toolchain

**Project name: DARP**, confirmed by the user on 2026-10-10. Use DARP in project
documentation and application metadata. MapnaCM and MOGSight are earlier names
still present in historical references and existing repository/backend paths.
**DARP branding (2026-10-11):** application product text and browser-title suffixes
use DARP, including `environment.appThemeName` in both builds. The user's later
logo-replacement request supersedes the earlier text-only restriction for product
logos and the favicon. Active branding uses SVG outlines traced from the supplied
`DARP digital asset retrofit logo.png`; preserve that emblem and custom lettering,
including the red details. Dark surfaces use white outlines, compact placements
use the standalone D emblem, and the sidebar has no slogan. Unrelated images and
original vendor logo assets are retained. Technical Metronic framework identifiers,
paths, vendor URLs and styling-policy references retain their actual names.
Variant mappings and dimensions are documented in `src/assets/media/logos/README.md`.
DARP is a frontend for a .NET backend (`Global.API`), built by adapting
Metronic 8 demo1. The npm package name is `darp`, version `8.3.0`; the Angular
workspace target remains `demo1`. Current dependencies use Angular **18.1**, TypeScript **5.5**,
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
| `src/app/core/` | Shared API models, centralized services, query serialization, auth interceptor |
| `src/app/core/services/` | Required service location; `AssetApiService` provides taxonomy CRUD and employer lookups |
| `src/app/shared/components/` | Required location for reusable components created or extracted from 2026-10-10 onward |
| `src/app/pages/routing.ts` | Lazy routes inside the authenticated layout |
| `src/app/pages/asset-taxonomy/` | Site, Plant/Plant Type, Unit, System, Asset, Component, Measurement management |
| `src/app/pages/user/` | Real MapnaCM user list, add/edit, activity toggle, delete, detail/audit view |
| `src/app/pages/role/` | Real role list/create; role detail still uses the vendor demo API |
| `src/app/pages/permission/` | Vendor demo API list/CRUD; detail component has no implementation logic |
| `src/app/pages/cm/vibration/` | Five routes share a tabbed measurement workspace; Execute opens independent analyses with dates, hierarchy details and the Time Domain sample chart |
| `src/app/pages/dashboard/`, `builder/` | Metronic demo dashboard and persisted layout builder |
| `src/app/modules/auth/` | Real login/profile restoration/revocation; registration and forgot-password placeholders |
| `src/app/modules/account/` | Real profile overview/update/avatar; other settings retain demo behavior |
| `src/app/modules/crud/` | Shared DataTables, modal, and confirmation wrapper |
| `src/app/modules/apps/chat/` | Demo conversations with local message state and simulated replies |
| `src/app/modules/profile/`, `wizards/` | Primarily template/demo screens |
| `src/app/modules/widgets-examples/` | Widget galleries, including the standalone Apache Charts gallery |
| `src/app/_metronic/` | Shared layout, icons, directives, theme DOM helpers, widgets |
| `src/app/shared/components/data-table/` | PrimeNG table/paginator/select/button adapters with Metronic visuals, typed pagination helper and adjacent tests, exposed through `SharedModule` |
| `src/app/shared/components/form-modal/` | Shared Metronic presentation for nine taxonomy form modals, each serving add/edit; page-owned forms projected into the shell, exported through `SharedModule` |
| `src/app/shared/components/request-state/` | Cancellable keyed read-state helper and shared Metronic loading/error/retry feedback, exported through `SharedModule` |
| `src/app/shared/components/asset-taxonomy-drawer/` | Standalone Metronic drawer with Select2 Plant selection and PrimeNG Tree measurement selection; currently replaces Activity Drawer on vibration routes |
| `src/app/shared/components/closable-tabs/` | Reusable PrimeNG Tabs adapter with Metronic visuals, close buttons, keyboard support, scrolling and active-only panel lifecycle |
| `src/app/shared/components/date-range/` | Single Flatpickr range input/calendar using Metronic's existing styles and local calendar dates; commits only complete ranges |
| `src/app/shared/components/analysis-workspace-panel/` | Shared analysis workspace with nested `analysis-panel/` measurement/date panel; inputs/events or a module-owned state connection, consumer-provided chart templates and opt-in Time Domain sample chart |
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
`src/app/shared/components/data-table/pagination/table-pagination.ts` and PrimeNG-rendered
tables. They do not use `<app-crud>`, despite matching DataTables styling/classes. Reuse this pattern
for taxonomy pages. `AssetApiService` lives in `src/app/core/services/asset-taxonomy-api.service.ts`
and requests up to 10,000 rows for client-side
search/filter/sort/paging; this is a current limit, not unlimited pagination.

All nine tables across the seven taxonomy pages use `<app-data-table>` from
`shared/components/data-table/`, declared/exported by `SharedModule`. This generic
wrapper owns the responsive table scroller and composes `<app-table-record>`
with `<app-paginationbar>`, passing the same required `TablePagination<T>` instance
to both. It forwards `tableId` and readonly typed `editRecord`/`deleteRecord` outputs
to the page without introducing API calls or confirmation logic. Optional
`loading`, `error`, `emptyMessage`, `actionsDisabled` and `retryDisabled` inputs
render Metronic request feedback; `retry` delegates reloading to the page.
Loading/error hide the table and paginator. Successful empty datasets show the
entity-specific empty message; filtering an existing dataset to zero rows shows
"No matching records found".

Pages own `RequestState` instances from `shared/components/request-state/` for
main lists and independent employer/site/type options. Keyed reads cancel stale
predecessors; chained hierarchy reads retain loading until all required reads
finish. Failed reads display inline Retry without discarding the search query.
Optional employer lookup failures leave the main table available. Successful
empty prerequisites show guidance to create the parent/type, and Add/Edit stay
disabled until required lookup data is ready. Page destruction cancels reads and
writes and dismisses only that page's modal. Existing endpoints and hierarchy
read order are retained; no new storage or backend contracts were introduced.

The underlying `<app-table-record>` remains available independently from
`shared/components/data-table/table-record/`, declared/exported by `SharedModule`. Its required
typed `table: TablePagination<T>` input supplies column definitions, sorting and
paged rows; cells render native values by each column key (null/undefined stay
blank). The optional `tableId` input defaults to `kt_profile_overview_table`;
existing distinct Plant Type/Measurement/Measurement Type IDs are preserved on the
PrimeNG table host; its native table has a generated ID. Query `#<tableId> table`
when accessing the native table. `p-table` owns row/empty-state rendering and
`pButton` supplies sort and row-action buttons with Metronic classes and Keenicons.
Typed `editRecord` and `deleteRecord` outputs emit the readonly row snapshot.
Pages own modal opening, delete confirmation and API mutations. The component
renders the table only; the data-table wrapper supplies its responsive container
and pagination bar. Toolbar/search/filter controls remain in host pages. Empty-state colspan derives
from the configured columns plus Actions. No DataTables plugin is initialized.

All nine taxonomy table footers use `<app-paginationbar [table]="table">` inside
the data-table wrapper. Plant passes separate `plants`/`types` instances to its
wrappers; Measurement passes separate `table`/`types` instances. The pagination
bar and its `pagination-records` and `pagination-pages` children live under
`shared/components/data-table/pagination/paginationbar/`. Import `SharedModule` to use the
wrapper or either child independently, passing the same required `table` input.
Both `table-record/` and lowercase `pagination/` are nested inside `shared/components/data-table/`.
The row-independent `PaginationState` interface describes readonly pagination
metadata and `setPageSize`/`goToPage`; existing `TablePagination<T>` instances
satisfy it directly. Components delegate state updates to the supplied table.
The records child uses PrimeNG `p-select` for page sizes; do not initialize Select2
on this control. The pages child uses `p-paginator` for the five-number window and
First/Previous/Next/Last controls, converting zero-based events into helper pages.
The footer stays outside horizontal scrolling so the dropdown is not clipped.
The helper remains the source of row/filter/sort/page state; PrimeNG does not
independently sort or paginate its supplied page rows. Empty results keep the
helper at page 1 with disabled navigation; PrimeNG renders no numbered empty page.

`TablePagination<T extends object>` retains native row values, searches the text
representations of explicitly configured fields, combines exact filters typed per field, supports
page sizes 10/25/50/100, and cycles default -> ascending -> descending -> default.
Sorting preserves the original row array. New searches/filters/sorts reset page 1.
Deletion prompts first; `onConfirmedDelete` delegates the mutation to the host.
Only one confirmation may be open per table. Hosts call `beginDelete(row)` before
the confirmed API mutation and `endDelete(row)` in its finalizer. Pending rows
disable Edit/Delete and show a spinner; ID-based locks survive row snapshot
replacement. Failed or cancelled mutations release the lock for another attempt.
Column keys use `Extract<keyof T, string>` and all nine column arrays use
`satisfies readonly TablePaginationColumn<RowType>[]`. Numbers sort numerically;
text sorts textually, including digit-prefixed names/tags. Columns may supply
typed `(left: T, right: T) => number` comparators. Site latitude/longitude use
explicit full-value numeric-text comparison; elevation is a native number and
uses the default numeric comparison. No default numeric-prefix parsing remains. Equal
values retain response order in both directions; clearing sorting restores
filtered response order. Sorting ignores fields not configured as columns.
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
The constructor requires typed `searchKeys`; all nine instances explicitly
include visible fields and exclude entity, parent, employer and type IDs.
Case-insensitive search safely treats null/undefined as empty text. Constructor
options can configure immutable finite positive integer `pageSizes`; the default
is `[10, 25, 50, 100]` and only configured values are accepted by `setPageSize`.
Invalid page/size changes leave state untouched. `clampPage` centralizes valid
page bounds; empty results use page 1, one page, and range 0 to 0.
`pages` exposes a cached window of at most five consecutive numbers around the
current page, shifting near either boundary. Templates have native disabled
First/Previous/Next/Last buttons and an `aria-current` indicator. Unchanged window
bounds retain the page-number array even when the current page changes.

Taxonomy forms use `NgForm`, required fields, `saving` guards, ng-bootstrap modal
templates, Metronic alerts, and refresh after successful mutation. Async updates
often call `ChangeDetectorRef.detectChanges()` to repaint within the shared layout.

Each taxonomy page composes its own `AssetTaxonomyMutations` helper from
`core/utils/asset-taxonomy-mutations.ts`, referencing the page's existing `saving`
flag, DestroyRef, alert service and change detector. `save` takes a request factory
and page-owned success callback; it marks saving before creating the request and
clears it before success/error actions. `delete` takes a row/table, numeric-ID
request factory, success callback and error fallback; it retains the saved-ID and
saving guards and releases the ID-based deletion lock through `finalize` on
success, error or cancellation. Pages keep validation/payloads, success messages,
refresh/dismiss ordering, modal guards and destruction cleanup. State is not shared
between pages; deletion does not set the saving flag. Plant and Measurement's two
forms use the same helper/local flag within their page.

All seven taxonomy pages delegate success/error notifications to the stateless
`MetronicAlertService` in `core/services/metronic-alert.service.ts`, provided in
root. Call `show(icon, title, text)` with `success` or `error`; the service owns
the common SweetAlert2 options and Metronic button classes. Messages and request
workflows remain page-owned. Delete confirmation still belongs to the existing
`TablePagination.confirmDelete()` integration.

As of 2026-10-10, all nine taxonomy form modals use `FormModalComponent` from
`shared/components/form-modal/`, exported by `SharedModule`. The component owns
the Metronic close button, heading/optional description, responsive body spacing,
cancel/submit actions and loading indicator. Each page projects its complete
`NgForm` and retains fields, models, validation, errors and save handlers. The
shared submit button associates with that form through native `form="formId"`;
IDs must be unique in the document. Saving disables submission, Close and Cancel.
Page-owned `beforeDismiss` guards block backdrop/programmatic dismissal during
saving; the shared shell prevents Escape at keypress time to cover ng-bootstrap's
deferred animation-frame handler. Failed saves retain the form values and restore
all actions; successful saves close the modal. Dismiss outputs
retain `Cross click` and `cancel`; ng-bootstrap still owns modal lifecycle.
Site's existing action IDs and edit description are retained. Select2 continues
to use the existing directive without additional plugin initialization.
Each entity has one modal template for both Add and Edit, including Plant Type
and Measurement Type. The page's form-model ID selects the title, submit label
and existing mode-specific DOM IDs; both actions open the same `TemplateRef`.
Opening Add resets the page-owned model; opening Edit copies the selected row.

All nine forms use shared `appTrimmedRequired` and `appFiniteNumber` validators
from `shared/components/form-validation/`, exported by `SharedModule`. Required
text rejects whitespace-only values; numeric validators expose the existing
finite-number rules to NgForm. Errors use Metronic invalid-feedback classes and
appear after touch or submission, with invalid state and descriptions connected
through ARIA. Every field has an associated label/ID; search fields have accessible
names and all Add actions are native buttons. Select2 mirrors native field names,
required/invalid state and error descriptions onto its visible combobox.

## Taxonomy and employer inheritance

Navigation order: **Site -> Plant -> Unit -> System -> Asset -> Component -> Measurement**.
The relationship chain is Measurement -> Component -> Asset -> System -> Unit -> Plant -> Site.
Plant Type is managed as a second table on the Plant page.
Successful Plant Type and Measurement Type create/update/delete operations refresh
both the type lookup table and the related main list, keeping joined names/units current.

- Site stores city/address/coordinates/location as strings. Elevation is numeric
  (`number | null` in the shared model for blank, required forms); Site Add/Update
  payloads require a finite number. Zero, negative values and decimals are valid.
- Plant selects numeric Site and Plant Type IDs and an Identity Employer user.
  Its payload contains `employerId` and the employer display-name snapshot.
- Plant candidate employers come from `getUsersByRole('Employer')`.
- Unit/System/Asset/Component/Measurement inherit the Plant employer via parent-ID maps.
- Their pure hierarchy transformations live in `core/utils/asset-taxonomy-hierarchy.ts`:
  `buildParentOptions`, `buildParentIdMap`, `buildPlantEmployerMap`, and
  `resolveInheritedEmployer`. Options retain saved numeric IDs and sort by the
  existing display-label fallback; relationship selectors retain numeric zero
  and skip null parents. Employer resolution follows supplied maps from parent
  to Plant. Pages still own the maps, request order, request state and row snapshots.
- Employer options come from `AssetApiService.getEmployerOptions()` as `{ id, name }`.
  All six employer filters compare Identity user IDs with row `employerId`,
  retaining the Plant's employer-name snapshot for display. Missing employer IDs
  remain unassigned; names do not establish relationships.
- Unit/System/Asset/Component parent options use `{ id: number, label: string }`.
  Forms, edit restoration, and parent filters bind numeric IDs; labels are displayed
  and sorted only. Duplicate or changed labels do not change relationships.
  Shared entity models retain numeric entity/parent IDs and nullable string
  Identity employer IDs. Entity IDs are optional for new forms, and parent
  selections are nullable while forms are incomplete; saved API records provide IDs.
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
`Measurement` and its row retain nullable type ID, type name, unit, and
sensitivity for legacy records. Null cells render blank; required fields must be
selected/filled when editing those records. Type deletion failures are surfaced from
the API. These are verified frontend contracts, not verified live backend behavior.

Asset, Component, and Measurement have an optional free-text Tag field in their
shared add/edit modal and a sortable Tag column after Name. Rows retain tags as
`string | null` (absent tags normalize to null); Angular renders them blank and
edit forms normalize null to `''`, so existing records remain searchable and editable.
Frontend create/update payloads include `tag`; clearing it submits `''`. These are
frontend models/bindings only; backend/database work belongs to the other team.

### Unified taxonomy model organization (2026-10-10)

- The user's later instruction supersedes the separate UI-model extraction:
  **one shared model per entity**, defined in `core/models/asset-taxonomy.model.ts` and
  used directly for API data, table state and Add/Edit forms across all seven pages.
  Models are `Site`, `PlantType`, `Plant`, `Unit`, `AssetSystem`, `Asset`,
  `Component`, `Measurement` and `MeasurementType`.
- Removed the seven page `.models.ts` files, separate Row/Form interfaces,
  standalone Payload interfaces and `asset-taxonomy-options.model.ts`.
  Parent/employer option helpers and `RoleUser` also live in `asset-taxonomy.model.ts`.
- Canonical entity name fields use `name`; parent display fields use the API's
  `plantLabel`, `unitLabel`, `systemLabel`, `assetLabel` and `componentLabel`.
  Plant/Measurement display types use `typeName`; inherited employer display uses
  `employerName`. Table/search keys and form bindings use these same fields.
- IDs are optional for unsaved forms; required parent selections can be null
  until validation; joined labels and audit data are optional. Measurement legacy
  null type/sensitivity values and tag normalization remain supported. Rows still
  use immutable snapshots; edit forms copy values to retain cancellation isolation.
- API write method types derive allowed fields from the shared model with `Pick`
  and required numeric ID constraints, instead of separate payload declarations.
  Every create/update method explicitly serializes its established request fields,
  excluding inherited display/audit fields; POST omits entity ID and PUT includes it.
  Plant Type create now accepts a name-bearing object internally; its HTTP body
  remains `{ name }`. Validation, endpoints, storage and Metronic visuals are retained.
- Ancestor maps skip unsaved records and null relationships; dropdown labels
  fall back to the parent's name when hierarchy text is absent. Delete handlers
  skip records without IDs. These guards support using the same model for blank
  form state and saved records while retaining strict compilation.

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

`SharedModule` exports Keenicons, `Select2Directive`, `PaginationbarComponent`,
`PaginationRecordsComponent`, `PaginationPagesComponent`, `TableRecordComponent`
`DataTableComponent` and `FormModalComponent`. Selects with
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

PrimeNG 18.0.2 and Angular CDK 18.2.14 are installed for the taxonomy table adapters.
`AppModule` uses `providePrimeNG(METRONIC_PRIMENG_CONFIG)` from
`shared/components/metronic-primeng.config.ts`. PrimeNG 18 exposes no public unstyled
input; this configuration uses an empty visual preset and a lower `primeng` CSS
cascade layer. No PrimeNG default theme/preset, PrimeIcons, PrimeFlex or Tailwind
stylesheet is imported. The namespaced `data-table/_metronic-table-adapters.scss`
partial is loaded after the existing Metronic Sass and reuses its variables and
mixins for pagination, form/select, dropdown and focus styling. Theme colors track
`data-bs-theme`. The default PrimeNG accessibility translations are retained.

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
rotor-position. All five now render `AnalysisWorkspaceComponent` directly. Each analysis
tab has a From/To date range and measurement hierarchy details above its sample
charts with tooltip and zoom. Frequency Domain now has a page-specific ideal
velocity amplitude spectrum; the other pages retain the synthetic 10 Hz + 25 Hz
time signal over two seconds. Both remain independent of selected measurements/
dates; no condition-monitoring backend feed or analysis API is connected.

### Vibration measurement selection (2026-10-11)

The authenticated layout now mounts `AssetTaxonomyDrawerComponent` instead of the
demo Activity Drawer on `/cm/vibration` routes, with a measurement selector button
in the former Activity header position. Other routes do not mount this selector.
The reusable standalone component lives in `shared/components/asset-taxonomy-drawer/`;
its `visible`, `selection`, `selectionSave`, `executed` and `closed` bindings let other features
own independent values without sharing vibration state. Use a unique, stable
`drawerId` if another consumer is mounted simultaneously.

`VibrationSelectionService` under `core/services/` is provided by `LayoutComponent`.
It holds the saved `{ plantId, unitId, measurementIds }` selection in memory across
the five vibration pages, including navigation away and back. No browser storage
or backend preference write is added. Selection ends when the authenticated layout
is destroyed, including logout or a full page reload. Pages can inject this service
and read `selection()` for future chart integrations; existing sample chart data
has not been changed or presented as measurement-backed data.

The drawer reloads six existing `AssetApiService.getAll*` reads on opening through
`RequestState` and `forkJoin`, with loading/error/retry and cancellation on dismissal.
Select2 uses the existing directive with the drawer as dropdown parent. The typed
`core/utils/asset-taxonomy-tree.ts` builder joins numeric parent IDs into
Unit -> System -> Asset -> Component -> Measurement, excluding incomplete chains
and preserving ID zero. Only Measurement leaves are selectable; PrimeNG Tree owns
expansion, search and keyboard interactions. Selection propagation is disabled.
As revised on 2026-10-12, selecting a leaf disables measurements from other Assets,
including Assets in the same Unit and filtered copies. Clearing the last leaf
releases the lock. Multiple Components within one Asset are allowed; this
supersedes the earlier single-Unit selection rule.

As revised on 2026-10-11, measurement selection/unselection immediately commits
IDs and keeps the drawer open. Deselecting the last measurement commits `null`.
Changing Plant clears the previous saved selection. Save and Clear selection
buttons and the "Other Units are locked" message are absent. Reset immediately
commits `null`, clears plant/measurements and leaves the drawer open. Dismissal
keeps the latest committed selection. Branch labels toggle PrimeNG's `expanded`
property; branches remain non-selectable. The header uses the hierarchy-shaped
Metronic `data` icon. Saved missing/reparented records produce a review message
without automatically changing the saved value during loading/restoration.
As revised later on 2026-10-12, Execute emits an `AssetTaxonomyExecution` containing
the current IDs and fresh measurement display details, then closes the drawer.
Execution requires a successful load and at least one selected measurement. The
`buildAssetTaxonomyExecution` helper validates complete numeric parent chains and
single-Asset membership and the selected Unit, including ID zero. Measurement details
omit joined hierarchy labels. The selected Plant's existing Site - Plant Type - Plant
`hierarchyLabel` is captured separately as the optional execution `plantLabel`,
falling back to its name when missing. Immediate selection saving remains active.
Metronic supplies drawer/overlay behavior and visuals; CDK supplies focus trapping,
with Escape and focus return. Destruction removes the observer, requests, overlay
and Metronic store entry. The scoped `_metronic-taxonomy-tree.scss` uses Metronic
tokens and the existing empty PrimeNG preset; no independent theme is introduced.
The installed PrimeNG 18 checkbox highlight/node `styleClass` inconsistencies are
handled using documented `aria-checked` and our template markers. Vendor source
files are unchanged. See the component README for usage and official references.

### Vibration analysis tabs (2026-10-12)

The shared UI lives in `shared/components/analysis-workspace-panel/`, with the
measurement/date component and template in its nested `analysis-panel/` folder,
at the user's request. `AnalysisWorkspaceComponent` accepts title/tabs/activeId,
emits selection/tab/date actions, and receives the consumer's chart template.
`AnalysisPanelComponent` renders the shared measurement/date header and that
template. Both use `core/models/analysis-panel.model.ts` (`AnalysisTab`,
`AnalysisDateRange`, `AnalysisDateRangeChange`). The date picker imports the same
generic model. Neither component injects a Vibration service or reads routes.

As revised later on 2026-10-12, the workspace also accepts a module-owned `state`
matching `AnalysisWorkspaceState`. State getters override the individual title,
tabs and active ID inputs; the workspace delegates selection, activation, closing
and date changes, while continuing to emit action notifications. Consumers using
state must not wire those outputs back to the same state methods.
All five Vibration pages pass their layout-owned `VibrationSelectionService`
directly and enable `showSampleChart`. Frequency Domain additionally supplies a
page-owned `measurementChartContent` template to the shared per-Measurement grid;
its implicit value is the executed Measurement detail, with the active tab as
`tab`. The whole-tab projected `chartContent` still has highest precedence.
The default Time Domain sample component/template
now live in `analysis-workspace-panel/`; the former wrapper folder was deleted. Sample
rendering defaults to false, and a projected chart template takes precedence.
Route constants remain in `core/models/vibration-page.model.ts`. Other modules
can still use the shared analysis components with their own state and charts,
without providing a Vibration service.

`VibrationSelectionService` additionally owns independent tab lists and active IDs
per vibration route. Every Execute, including repeated identical selections, opens
a new active tab with copied measurement details and its own local `YYYY-MM-DD`
date range (initially seven days ago through today). Closing a tab removes its
state and activates the next/previous surviving tab; closing the last shows the
empty state. The current workspace has no internal selection button; consumers
open selection externally. Navigation preserves tabs;
all state ends with the authenticated layout. No browser persistence is added.

The standalone reusable `ClosableTabsComponent` uses the installed PrimeNG 18 Tabs
API and a scoped Metronic adapter with the existing empty preset. Native close
buttons and Delete are supported alongside PrimeNG keyboard navigation and scroll
controls. Inactive panel content is destroyed, while values remain in the service.
Charts and the range calendar instance are disposed on close/switch. The sample chart
mounts after tab projection so ECharts receives real dimensions.

`DateRangeComponent` uses Metronic's Flatpickr integration (runtime 4.6.13 added;
its base CSS sits below the already-loaded Metronic plugin customization). One
input/calendar uses Flatpickr range mode, commits only completed inclusive ranges
and synchronizes restored tab dates. Dismissing a partial selection restores the
last committed range. Values remain local YYYY-MM-DD strings.
As revised on 2026-10-12, the selection heading displays the executed tab's
`plantLabel` in Site - Plant Type - Plant order. The Unit - System - Asset path
appears once below, alongside the count and without Component/Measurement lists.
All snapshot metadata remains available for integration. Plant labels persist
independently per tab; consumers without a label receive an Analysis heading.
One independent sample chart appears below per selected Measurement, titled with
its Component - Measurement names and the Measurement tag when present.
Frequency Domain uses its dedicated spectrum component/data in that page folder,
with Frequency (Hz) from 0 to 125 Hz and Amplitude (mm/s peak) axes. Its ideal
one-sided sample spectrum has 0.5 Hz bins and peaks of 2 mm/s at 10 Hz and 1 mm/s
at 25 Hz. The other pages retain their existing Time Domain waveform. These
previews are synthetic and are not FFTs or API results for selected Measurements.
The hierarchy path, Sample data badge and waveform description are absent above charts. Unique heading
IDs preserve accessible labels, and each chart has independent zoom state.
An accessible Metronic icon toggle above the sample charts switches from the
default one-chart-per-row layout to two equal columns at 768px and above;
smaller screens remain single-column. It is disabled for zero/one Measurement.
The layout preference stays in the workspace instance across tab switches,
without browser persistence; single-chart tabs always use full width. Layout
changes retain ECharts instances/zoom and reuse their existing ResizeObserver.
The charts use Metronic theme tokens; later backend work can connect the saved
IDs/dates without an invented contract in this change.

## Porting a static Mapna-UIUX page

This is the normal workflow for this project. The default reference directory is
`C:/Users/hafez/Documents/Mapna/Mapna-UIUX/customize` (`../../Mapna-UIUX/customize`
from this repository). It uses `customize/<page>.html`, `_template.html`, and
occasionally matching JavaScript (currently `siteplant.js` is present).

1. Read the requested design and compare its dependencies with `_template.html`.
2. Port only page content inside `#kt_app_content_container`; Angular supplies
   the header/sidebar/footer. Content markers vary, so inspect the actual HTML.
3. Reuse the design's existing Metronic styles, scripts, content, and dependencies.
   Preserve required existing assets and load them only when needed. Follow the
   Mandatory Styling Policy above: no competing visual design system; PrimeNG
   and Spartan UI may supply behavior through Metronic-compatible adapters.
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
- `README.md`: the previous Angular 13 description was corrected to Angular 18;
  its end-to-end instructions describe adding a target, not an existing configured one.
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

Historical styling/library restrictions in this entry are superseded where they
conflict with the Mandatory Styling Policy adopted on 2026-10-10.

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

### 2026-10-06 - Pagination, search fields and column sorting safeguards

- Reviewed the helper, all nine table definitions/templates, consumers and tests.
  Existing integer/range guards, empty page handling, immutable row replacement,
  reset policies and cached derivations were retained. Added configured-size
  membership/finite checks and constructor validation of custom size lists.
  Centralized clamping in `clampPage`; consumers already use `setRows` and need
  no independent clamping. Search/filter/valid-size changes still reset page 1.
- Added a cached five-number page window with boundary shifting. Every taxonomy
  table now includes First/Last controls alongside Previous/Next, using existing
  Metronic pagination classes, native disabled buttons and current-page metadata.
  No custom styles or theme JavaScript were added.
- Required explicit typed searchable keys in constructor options; configured
  all seven pages/nine tables. Hidden IDs no longer participate in search.
  Columns accept typed row comparators. Default sorting handles numbers and text
  separately, with centralized null/undefined ordering and stable index tie-breaks.
  Explicit Site comparators parse entire numeric coordinate strings and formatted
  metre elevations via `table-pagination-comparators.ts`. Unparseable/blank numeric
  text sorts before valid numbers, and unparseable pairs sort textually. API field
  types and payloads were not changed. Cleared sorting restores filtered API order.
- Added **23** focused regressions covering configured/invalid sizes/pages,
  window boundaries, shrink/empty/reset behavior, custom sizing, textual versus
  numeric ordering, nulls/ties/custom comparators, hidden-ID exclusion across all
  nine tables, and rendered navigation/disabled/range behavior. Existing cache
  tests still verify page/size changes do not filter or sort again. Small sizes
  used by earlier unit tests are now explicitly configured in those tests.
- Verified strict Angular compilation, normal test TypeScript compilation,
  production build, project lint, `git diff --check`, and all **88** focused
  ChromeHeadless tests (taxonomy, pagination/comparators and Select2) passed.
  Existing 2.70 MB initial-bundle warning and four CSS selector warnings remain.
  API calls were mocked; live backend integration, manual visual auditing and
  browser performance benchmarking were not performed.

### 2026-10-06 - Reusable pagination bar and child components

- Extracted the supplied footer into `PaginationbarComponent`, composed of
  `PaginationRecordsComponent` (size/range) and `PaginationPagesComponent`
  (numbered navigation). All files live under the requested
  `_metronic/shared/Pagination/paginationbar/` directory. `SharedModule` declares
  and exports all three so either child can also be used independently.
- Added the required typed `table` input using the row-independent
  `PaginationState` interface. Reused the helper's metadata and methods without
  introducing duplicate pagination state. Replaced all nine footer copies across
  seven taxonomy templates, retaining their individual table bindings.
- Preserved Metronic classes, responsive wrapper, live range status, current-page
  metadata and disabled navigation. Reused the existing Select2 directive inside
  the records child; no custom styles, new theme scripts or API/storage changes.
- Added six browser integration checks for composition, navigation/window/range,
  native and Select2 size changes dispatched once, external state/empty results,
  independent tables/custom sizes, and independent child reuse/plugin cleanup.
- Verified production build (including strict Angular template compilation),
  normal test TypeScript compilation, project lint, `git diff --check`, and all
  **94** focused taxonomy/pagination/Select2 ChromeHeadless tests. Existing
  2.70 MB initial-bundle warning and four CSS selector warnings remain. API calls
  were mocked; live backend integration and manual visual auditing were not run.

### 2026-10-06 - Reusable taxonomy table record component

- Extracted the supplied table into `TableRecordComponent<T>` under the requested
  `_metronic/shared/table-record/` folder and declared/exported it in `SharedModule`.
  Replaced all nine table copies across Site, Plant/Plant Type, Unit, System,
  Asset, Component and Measurement/Measurement Type with `<app-table-record>`.
- Uses the existing required `TablePagination<T>` instance and column keys for
  headers, three-state sorting, paged cells and dynamic empty-state colspan.
  Optional `tableId` preserves the existing DOM IDs; readonly typed row outputs
  delegate edit/delete actions to the original page handlers. Native numbers,
  null rendering, confirmation callbacks, search/filter/pagination state, API
  contracts and storage decisions are retained. Added accessible action labels.
- Preserved Metronic classes, Keenicons and existing responsive wrappers/footer
  composition. No custom styles, theme scripts or duplicate plugin initialization.
- Added five shared component browser tests, four page integration checks and
  one Plant/Plant Type action-routing check, alongside existing modal, API,
  Measurement Type and confirmation regression tests.
- Verified strict Angular compilation, normal test TypeScript compilation,
  production build, project lint, `git diff --check`, and all **104** focused
  taxonomy/table/pagination/Select2 ChromeHeadless tests. Existing initial-bundle
  warning (2.70 MB against 2 MB) and four CSS selector warnings remain. API calls
  were mocked; live backend integration and manual visual auditing were not run.

### 2026-10-06 - Move table and pagination into custom components

- Moved the complete `table-record/` and `Pagination/` folders, including their
  templates, helper/comparators, pagination children and adjacent tests, from
  `_metronic/shared/` into `src/app/custom-components/`, preserving folder casing.
- Updated `SharedModule` imports, all seven taxonomy page helper imports, the
  Site comparator import and affected test imports. Existing module declarations
  and exports continue to expose the components; their behavior is unchanged.
- Verified both old folders are absent and no stale application imports remain
  (historical generated graph reports are outside the application source audit).
  Production build with strict Angular template checks, project lint, normal test
  TypeScript compilation and all **104** focused taxonomy/table/pagination/Select2
  ChromeHeadless tests passed. `git diff --check` passed. Existing 2.70 MB initial
  bundle-budget warning and four CSS selector warnings remain. Tests mock APIs;
  live backend integration and manual visual auditing were not performed.

### 2026-10-06 - Composed data table wrapper

- Added generic `DataTableComponent<T>` under `custom-components/data-table/`,
  declared/exported through `SharedModule`. `<app-data-table>` composes the
  existing table record and pagination bar using one required `TablePagination<T>`
  input, the original responsive Metronic container and an optional `tableId`.
  Readonly typed edit/delete outputs forward the current row once to host pages.
- Replaced all nine table/footer pairs across seven taxonomy page templates,
  preserving each table instance, DOM ID, modal and confirmation handler.
  Pages retain search/filter controls, data loading and API workflows. The
  original components remain independently exported. No helper, API, storage,
  custom style or theme script behavior changed.
- Added five wrapper browser integration tests for navigation/sorting and row/range
  synchronization, native/Select2 sizing, event forwarding, external state/input
  replacement and empty results, and independent wrappers with different row types.
  Updated existing taxonomy/Plant integration checks to exercise the wrapper.
- Verified production build with strict Angular template checks, project lint,
  normal test TypeScript compilation, `git diff --check`, and all **109** focused
  taxonomy/data-table/table-record/pagination/Select2 ChromeHeadless tests passed.
  Existing 2.70 MB initial-bundle budget warning and four CSS selector warnings
  remain. API calls were mocked; live backend integration and manual visual
  auditing were not performed.

### 2026-10-06 - Nest table record and pagination inside data table

- The linked `_metronic/shared/table-record/` and `_metronic/shared/Pagination/`
  locations were already absent; moved the current complete folders from
  `custom-components/` into `custom-components/data-table/`, preserving casing.
  All 15 relocated files retain their implementation/templates and adjacent tests;
  only two relocated test imports needed an additional parent-directory level.
- Updated SharedModule, wrapper and test imports, all seven taxonomy page helper
  imports, and the Site comparator import. Existing wrapper work and independently
  exported child components are preserved. Confirmed old folders are absent and
  no stale application imports remain; historical generated reports were excluded.
- Verified production build with strict Angular template compilation, project lint,
  normal test TypeScript compilation, and all **109** focused data-table, table-record,
  pagination, taxonomy and Select2 ChromeHeadless tests passed. Existing 2.70 MB
  bundle-budget warning and four CSS selector warnings remain. APIs were mocked;
  live backend integration and manual visual auditing were not performed.

### 2026-10-10 - Central service location rule and taxonomy migration

- The user established `src/app/core/services/` as the required service location.
  Recorded this rule in `AGENTS.md` and the working agreement above.
- Moved `AssetApiService` from `pages/asset-taxonomy/services/` into
  `core/services/`, adjusted its environment/model/utility imports, and updated
  all seven taxonomy pages plus four existing test files to import the central
  service. Root injection scope, API endpoints, payloads and behavior are retained.
  Existing services in other features and vendor code were not relocated in this
  taxonomy-focused change; their locations do not establish a new-service pattern.
- Verified production build, project lint, focused taxonomy TypeScript compilation,
  and all **50** taxonomy ChromeHeadless tests. Existing 2.70 MB initial-bundle
  warning and four CSS selector warnings remain. No stale taxonomy service imports
  remain in application TypeScript; historical generated graph reports were retained.
- Normal test TypeScript compilation and the standard focused browser command
  are currently blocked by existing `Pagination` versus on-disk `pagination`
  casing errors (TS1149) in the shared table tests. Used a temporary tsconfig
  selecting taxonomy specs without weakening compiler checks, then removed it.
  Browser tests mocked APIs; live backend integration was not tested.

### 2026-10-10 - Reusable component location rule

Historical directory spelling: the singular `component/` in this entry was
superseded by the user's later `components/` rename on 2026-10-10.

- The user established `src/app/shared/component/` (singular `component`) as the
  required location for every reusable component from now on. Recorded the rule
  in `AGENTS.md`, the working agreement and the source map.
- Inspected the current shared module and data-table component. Existing reusable
  components remain in their current locations; this request establishes the
  future placement rule and does not relocate existing implementations.
- Documentation-only update. Verified `git diff --check`; application build and
  tests were not rerun because application source was not changed in this update.

### 2026-10-10 - Taxonomy API service filename

- Renamed the central service file to `core/services/asset-taxonomy-api.service.ts`
  at the user's request. Updated all seven page imports, four existing test imports,
  and current documentation paths. The exported `AssetApiService` class and its
  implementation are unchanged; the requested change is the filename.
- Verified strict Angular compilation (`npx ngc -p tsconfig.app.json --noEmit`),
  focused taxonomy test TypeScript compilation, project lint, and `git diff --check`.
  No stale application imports remain. The temporary focused tsconfig was removed;
  it avoids the previously recorded unrelated pagination casing errors without
  weakening compiler checks. Production build and browser tests were not rerun
  for this filename-only update; live backend integration was not tested.

### 2026-10-10 - Project name is DARP

- The user confirmed DARP as the project name. Updated `AGENTS.md`, this file's
  heading/identity section, README, and the browser title. The npm package and
  lockfile root names are now `darp` (lowercase package spelling).
- Existing Angular workspace target `demo1`, build output `dist/demo1`, theme
  identity, repository paths and backend integration contracts are retained.
- Verified JSON parsing and matching package/lockfile root names, the HTML title,
  and `git diff --check`. Build and browser tests were not rerun for these
  documentation/metadata changes; runtime behavior was not changed.

### 2026-10-10 - Mandatory Metronic-only styling policy

- Added the user's complete Mandatory Styling Policy as the authoritative current
  styling policy and aligned `AGENTS.md` with it. New policy takes precedence over
  conflicting older guidance, including historical restrictions.
- Resolved the older blanket prohibition on custom styling and additional UI
  libraries: PrimeNG and Spartan UI may provide behavior only, with default visuals
  disabled or reliably replaced. Metronic-compatible templates/classes, tokens,
  styling APIs and centralized reusable adapter styling are permitted. Competing
  visual systems and the policy's explicitly prohibited techniques remain forbidden.
- Updated the static-page conversion workflow and marked the original 2026-10-04
  restriction entry as historical where it conflicts. Retained non-conflicting UI
  scope, integration/lifecycle, service-location and reusable-component rules.
- Recorded the required stop/explain/request-approval condition for libraries whose
  default styling cannot reliably be disabled or replaced, and all visual acceptance
  criteria. This documents future requirements; it does not certify existing UI.
- Inspected `package.json` and global style imports: PrimeNG and Spartan UI are not
  currently declared dependencies. No packages, application code or styles changed.
  Verified the policy contents and `git diff --check`; build/browser tests were not
  rerun for this documentation-only update.

### 2026-10-10 - PrimeNG data table with Metronic visuals

- Moved the entire reusable data-table implementation/helper/comparators/tests from
  `custom-components/data-table/` to `shared/component/data-table/`, standardized
  imports on lowercase `pagination/`, and updated SharedModule and all seven
  taxonomy pages. All nine tables use the same exported component contracts.
- Replaced rendered table/empty-state markup with PrimeNG `p-table`, navigation
  with `p-paginator`, page-size Select2 with `p-select`, and sort/row-action buttons
  with `pButton`. Retained typed cached table state, native/nullable fields, custom
  comparators, three-state sorting, row snapshots, search/filter controls and host
  modal/confirmation/API workflows. Page sizes reset page 1; zero-based paginator
  events map to the helper's one-based page. Footer stays outside table scrolling.
- Installed PrimeNG 18.0.2 and explicit Angular CDK 18.2.14 (Angular 18 compatible).
  Added an empty-preset/lower-layer PrimeNG configuration and namespaced Metronic
  Sass adapters using existing theme tokens/mixins. No PrimeNG default visual theme,
  PrimeIcons, PrimeFlex or Tailwind styles are used. Default accessibility locale
  values are preserved. Table IDs remain on the PrimeNG hosts; native table IDs
  are generated. The folder README documents reuse and inspection details.
- Updated existing integration assertions to exercise actual PrimeNG dropdown
  overlays/buttons and retained the original behavior checks. Added keyboard
  selection, responsive footer/accessibility and light/dark style comparisons
  against the previous Metronic pagination markup.
- Verified production build, project lint, normal test TypeScript compilation,
  `git diff --check`, and all **112** focused tests. Repeated those tests with
  1440x1000 and 390x844 ChromeHeadless launchers: **224 executions passed**.
  The former shared-table casing blocker is resolved by the relocation/import
  normalization. Temporary responsive Karma configuration and logs were removed.
- Initial bundle is now approximately **2.77 MB**, still above the existing 2 MB
  warning budget; the four existing CSS selector warnings remain. APIs were mocked
  in tests. Computer-use reported no browser available, so manual visual inspection
  was unavailable; computed-style/theme/responsive checks ran in ChromeHeadless.
  Live backend integration and a browser performance benchmark were not performed.

### 2026-10-10 - Plural shared components directory

- Renamed `src/app/shared/component/` to `src/app/shared/components/` at the user's
  request. All 22 files were relocated; their contents differ only in updated
  folder references. Updated SharedModule, application configuration, all taxonomy
  helper/test imports, the global Sass import and the data-table README test command.
- Updated `AGENTS.md` and current sections of this file: the reusable-component
  location rule now requires the plural `src/app/shared/components/`. Older log
  paths describe historical locations and are superseded by this entry.
- Verified production build, project lint, normal test TypeScript compilation,
  `git diff --check`, absence of stale application/guidance references, and removal
  of the old folder. Existing 2.77 MB bundle warning and four CSS selector warnings
  remain. Browser tests were not rerun for this directory-only relocation; no
  component behavior, API contracts or storage decisions changed.

### 2026-10-10 - Shared asset taxonomy form modal presentation

- Inventoried all 18 add/edit dialogs for Site, Plant, Plant Type, Unit, System,
  Asset, Component, Measurement and Measurement Type. Compared the existing Angular
  markup with the matching static Site/Plant/Unit/System references and their
  Metronic dependencies; retained the existing Angular/ng-bootstrap integration.
- Added `FormModalComponent` under `shared/components/form-modal/`, exported by
  `SharedModule`. All seven pages use its common header/body/title/actions/loading
  presentation through ten form-shell instances (shared add/edit templates reuse
  eight of them; Site retains two distinct form templates).
- Preserved every existing input/select/option binding, form ID, page-owned NgForm,
  save handler, API integration and confirmation workflow. Native HTML form
  association connects the shared submit button to the projected page form.
  Saving now disables the submit action. Close is an accessible native button;
  forms reference their heading through `aria-labelledby`. No custom visual
  styles, packages, theme scripts, API contracts or storage changes were added.
- Added six browser checks for projected NgForm registration/numeric values,
  invalid/touched fields, loading/retry behavior, edit/close presentation, cancel
  and Select2 cleanup, theme colors and viewport overflow. Updated existing page
  tests to click the actual shared submit button instead of dispatching form events.
- Verified production build with strict template checks, project lint, normal test
  TypeScript compilation and all **118** focused taxonomy/shared-table/Select2/modal
  tests. Repeated with 1440x1000 desktop and 390x844 mobile ChromeHeadless launchers:
  **236 executions passed**. Temporary Karma configuration was removed. Final
  binding audit confirmed all page fields unchanged and no duplicated modal chrome.
  Existing 2.77 MB bundle warning and four CSS selector warnings remain. APIs were
  mocked; live backend integration and manual visual inspection were not performed.

### 2026-10-10 - Taxonomy delete and save dialog source review

- Verified all nine taxonomy tables use `TablePagination.confirmDelete()` in
  `shared/components/data-table/pagination/table-pagination.ts` for the SweetAlert2
  delete confirmation; confirmed deletion delegates to the page's API handler.
- Add/edit presentation lives in `shared/components/form-modal/`; fields and
  save handlers remain in each taxonomy page. There is no separate approval
  confirmation before saving: valid Submit/Save calls the existing API directly,
  and page-owned SweetAlert2 alerts display success or failure afterward.
- Source review only; no application behavior changed and no runtime tests or
  live backend integration were run for this clarification.

### 2026-10-10 - One taxonomy modal for Add and Edit

- Replaced separate add/edit wrappers with one modal template per entity across
  all seven taxonomy pages (nine forms including Plant and Measurement Types).
  Site now also shares one field layout. Both actions pass the same template;
  the existing form-model ID selects title, submit label and mode-specific IDs.
- Retained the shared Metronic shell, Site edit description/action IDs, form
  bindings, validation, Select2 lifecycle and existing create/update handlers.
  No API contracts, storage, service implementations or styles changed.
- Added nine browser regressions covering cancelled edits followed by pristine
  Add forms, shared-template identity, headings, native submit association,
  accessible form labels, row isolation and required-field validation. Tests
  wait for ng-bootstrap's closing animation before inspecting the next dialog.
- Verified production build, normal test TypeScript compilation, project lint,
  and all **65** focused taxonomy/modal ChromeHeadless tests. All **15** modal
  tests also passed with a 390x844 mobile launcher, including shared light/dark
  theme and overflow checks. Removed temporary Karma configuration.
  Existing 2.77 MB bundle-budget warning and four CSS selector warnings remain.
  APIs were mocked; manual visual inspection and live backend integration were
  not performed.

### 2026-10-10 - Extract taxonomy page and shared UI models

- Moved all 18 row/form interfaces into seven adjacent `<page>.models.ts` files,
  with type-only imports in Site, Plant, Unit, System, Asset, Component and
  Measurement. Kept row/form types distinct and all original fields/nullability.
  Gave the exported Plant Type and Measurement Type models explicit names.
- Added shared parent-option, employer-option and nullable inherited-employer
  interfaces under `core/models/asset-taxonomy-options.model.ts`. Updated page
  arrays/maps/lookup signatures and `AssetApiService.getEmployerOptions()` to use
  them. Shared API entities/payloads remain in `core/models/asset.model.ts`.
- Verified all extracted field shapes against HEAD and identical emitted
  JavaScript across the seven components and API service. Templates, styles,
  validation, payloads, hierarchy loading and storage behavior are preserved.
- Production build with strict Angular template checks, project lint, normal test
  TypeScript compilation, `git diff --check`, and all **65** focused taxonomy/modal
  ChromeHeadless tests passed. Existing 2.77 MB bundle warning and four CSS
  selector warnings remain. API calls were mocked; live backend integration and
  a new manual visual audit were not performed for this type-only extraction.

### 2026-10-10 - One shared taxonomy model per entity

- At the user's request, consolidated all taxonomy entity definitions into
  `core/models/asset.model.ts`. Each entity's API data, table and form use the
  same shared interface. Removed separate Row/Form/Payload interfaces, seven
  page model files and the separate options model file from the previous work.
- Updated tables, searches, modal bindings and confirmation labels to canonical
  `name`, parent-label, `typeName` and `employerName` fields. Preserve response
  fields in table snapshots and copy editable values for cancellation isolation.
  Optional unsaved IDs, nullable blank selections, joined display fields and
  inherited-employer enrichment are documented in the shared model.
- Service write signatures derive fields from these models and still require
  numeric saved IDs/selected relationships. Added explicit field serialization
  for every create/update request so full entity objects cannot send audit/joined
  display fields. Plant Type create accepts a name-bearing object internally;
  the existing backend endpoint and `{ name }` request are unchanged.
- Updated three existing specs for canonical field names and added ten HTTP
  regression tests: create/update contracts for all nine entities, preserving
  null employer clearing, empty tags and zero sensitivity/type IDs, plus the
  business-failure observable path. Existing modal/validation/row isolation
  tests continue to exercise the unified models.
- Verified strict Angular compilation, normal test TypeScript compilation,
  production build, project lint, `git diff --check`, and all **75** focused
  taxonomy/modal/API ChromeHeadless tests. Existing 2.77 MB bundle warning and
  four CSS selector warnings remain. No stale taxonomy model imports remain.
  Requests were mocked; live backend integration and manual visual inspection
  were not performed. Templates retain their visuals and existing control names.

### 2026-10-10 - Taxonomy model filename

- Renamed the shared model file from `core/models/asset.model.ts` to
  `core/models/asset-taxonomy.model.ts` at the user's request. Updated imports
  in all seven taxonomy pages and the central API service, plus current model
  documentation above. Historical paths in earlier maintenance entries describe
  the old filename and are superseded by this entry.
- Model contents, entity names, behavior and API contracts are unchanged.
  Verified strict Angular compilation, normal test TypeScript compilation,
  project lint, `git diff --check`, removal of the old file and absence of stale
  application imports. Build/browser tests were not rerun for this filename-only
  update; the prior 75 passing focused tests belong to the preceding task.

### 2026-10-10 - Component and Measurement model names

- Renamed the shared `TaxonomyComponent` interface to `Component` and
  `TaxonomyMeasurement` to `Measurement` in `core/models/asset-taxonomy.model.ts`
  at the user's request. Updated all API service and page type references,
  including tables, forms and derived write signatures, plus current guidance.
- The Component page imports Angular's decorator as `AngularComponent` and uses
  `@AngularComponent` so the entity model can retain the exact name `Component`.
  Entity fields, API contracts, page selectors/templates and behavior are retained.
- Verified strict Angular compilation, normal test TypeScript compilation,
  project lint, `git diff --check`, and absence of old model names in application
  TypeScript. Build/browser tests were not rerun for this type-name-only change;
  historical model names in older maintenance entries are superseded here.

### 2026-10-10 — Numeric Site elevation

- Changed the canonical Site elevation to `number | null`; null represents the
  blank required form. Site create/update payload signatures require `number`.
- The shared Add/Edit input uses `type="number" step="any"`. Submission rejects
  blank/nonfinite values and preserves zero, negative values and decimals.
- Elevation uses native numeric table sorting; removed its obsolete formatted
  text comparator. Coordinates retain their existing string models.
- Verified: production build, lint, test TypeScript compilation, and 123 focused
  ChromeHeadless tests passed (taxonomy, form modal, API serialization, pagination).
  Existing 2.77 MB initial bundle budget warning and four selector warnings remain.
  Backend numeric elevation integration has not been exercised against a live API.

### 2026-10-10 - Keep main taxonomy lists current after type changes

- Corrected a finding from the seven-page review: tool output JSON escaping was
  misread as source escaping. The existing `\u2014` fallback is a valid JavaScript
  Unicode escape that renders an em dash. TypeScript AST inspection verified all
  six employer-bearing pages have real em-dash literals and no literal escaped
  Unicode text. No employer display changes were necessary.
- Plant Type and Measurement Type successful create/update/delete callbacks now
  reload the associated Plant/Measurement list as well as the type table/options.
  Measurement rows consequently receive refreshed type names and units through
  the existing API reads. Failed writes retain the existing tables and open form.
  Models, request serialization, endpoints, styles and storage decisions are unchanged.
- Added eight focused regressions in `taxonomy-type-refresh.spec.ts`, using the
  real pages/templates and mocked HTTP: both entity types cover successful edit,
  create, rejected edit and successful deletion, including rendered type/unit cells.
  The six page/integration spec files removed in `f6adcd1` were not restored.
- Verified production build with strict templates, project lint, normal test
  TypeScript compilation, all **85** focused taxonomy-type/API/shared-control/Select2
  ChromeHeadless tests, and `git diff --check`. Existing 2.77 MB initial-bundle warning
  and four CSS selector warnings remain. Live backend integration and manual visual
  inspection were not performed; the eight new tests use mocked HTTP responses.

### 2026-10-10 - Standard taxonomy validation and accessibility

- Applied one validation/feedback pattern to all seven taxonomy pages and all
  nine Add/Edit forms, including Plant Type and Measurement Type. All 23 required
  controls show field-level Metronic feedback after touch/submission; all 29 form
  controls have linked labels/IDs. Nine Add actions use `button type="button"`,
  and all nine searches have accessible names. Error descriptions and invalid
  state clear when the values are corrected; optional fields remain optional.
- Added shared TrimmedRequired/FiniteNumber directives under
  `shared/components/form-validation/`, exported through SharedModule. Required
  text rejects whitespace without changing model values. Entity name payloads
  trim surrounding whitespace consistently. Site coordinate fields retain their
  string contracts; no new coordinate ranges or numeric sensitivity/elevation
  restrictions were introduced. Zero, negative values and decimals remain valid.
- Extended the existing Select2 adapter to mirror field names, required state,
  invalid styling and error descriptions onto the visible combobox as Angular
  attributes change. Explicit field names take precedence over Select2's generated
  selected-value label; default labeling is restored when an explicit label is
  removed. Plugin initialization, numeric value accessors and cleanup remain.
- Added 29 real-page/modal regressions for Add/Edit labels, whitespace rejection,
  inline feedback, clearing errors, normalized requests, rejected-write retry,
  invalid numeric values, zero/negative decimals, light/dark colors and overflow.
  Added one adjacent Select2 test for accessible naming and dynamic error state.
- Verified production build with strict templates, project lint, normal test
  TypeScript compilation, and all **115** focused taxonomy/API/shared-control/Select2
  tests with 1440x1000 desktop and 390x844 mobile ChromeHeadless launchers:
  **230 executions passed**. Light/dark and responsive checks use computed styles
  and browser geometry. Removed the temporary Karma configuration; verified
  `git diff --check`. Existing 2.77 MB bundle warning and four CSS selector warnings
  remain. APIs were mocked; manual visual inspection and live API integration were
  not performed. No new visual styles, dependencies, endpoints or storage were added.

### 2026-10-10 - Taxonomy request feedback and mutation guards

- Added consistent loading, inline error/Retry and successful-empty states to all
  seven taxonomy pages and nine tables. Loading no longer displays filtered-empty
  text. Searches survive retries. Independent lookup failures have their own
  feedback; optional employer failures leave main rows usable. Empty required
  parent/type lists provide creation guidance and disable dependent Add actions.
- Added reusable RequestState and RequestFeedbackComponent under
  `shared/components/request-state/`. Keyed reads cancel superseded requests;
  hierarchy chains retain loading until their final read. Page destruction
  cancels outstanding subscriptions and dismisses the page-owned modal.
- Saving disables Close/Cancel/Submit and prevents backdrop, Escape and
  programmatic dismissal. Escape is prevented at keypress time because
  ng-bootstrap defers its handler to an animation frame. A failed save leaves
  values intact and restores actions; successful saves close normally.
- Added per-table confirmation guards and per-entity pending deletion locks.
  Repeated clicks cannot create duplicate confirmations or DELETE requests.
  Pending rows disable Edit/Delete and display a spinner; failed requests unlock
  the row for retry. ID-based locks survive immutable row snapshot replacement.
- Added 33 real-page integration regressions, four read-state unit tests and two
  deletion-state tests. Verified production build with strict templates, project
  lint, normal test TypeScript compilation and all **154** focused
  taxonomy/API/shared-control/Select2 tests with 1440x1000 desktop and 390x844
  mobile ChromeHeadless launchers: **308 executions passed**. Assertions include
  light/dark error colors, responsive overflow, retry, queued Escape after a
  failed save and duplicate deletion clicks. Temporary generators/Karma config
  were removed; `git diff --check` passed.
- Existing 2.77 MB initial-bundle warning and four CSS selector warnings remain.
  HTTP responses were mocked; live backend integration and manual visual review
  were not performed. Existing Metronic classes, endpoints, data models and
  storage decisions were preserved; no dependencies or visual styles were added.

### 2026-10-10 - Focused taxonomy duplicate cleanup

- Unit now uses its existing `loadUnits()` for the initial hierarchy load and
  successful create/update/delete refreshes. Removed the identical
  `loadUnitsOnly()` implementation; employer enrichment, keyed request state,
  cancellation and page-reset behavior remain in the retained loader.
- Removed unused page-level `deleteUnit()`, `deleteSystem()` and `deleteAsset()`
  confirmation wrappers after checking application/template references. Their
  templates already call `table.confirmDelete()` directly. Confirmed API delete
  handlers, ID-based locks and finalizers remain intact; used Site/Plant/Type
  wrappers were retained.
- Plant has one `employers` options array for filtering, assignment and employer
  display-name lookup during submission. Removed `employerUsers` and its duplicate
  assignment, and updated the modal option binding. Existing employer read/retry,
  optional clearing and request serialization remain unchanged.
- The five application files have 33 fewer net lines. No API/model/storage,
  dependency, styling or validation changes were made; existing removed specs and
  the untracked architecture report were preserved.
- Verified production build with strict Angular templates, project lint, normal
  test TypeScript compilation, reference searches and `git diff --check`.
  Existing 2.77 MB initial-bundle warning and four CSS selector warnings remain.
  Browser tests, manual visual review and live backend integration were not run
  for this behavior-preserving cleanup; no new tests were added.

### 2026-10-10 - Shared Metronic alert service

- Added stateless, root-provided `MetronicAlertService` under `core/services/`.
  Its `show(icon, title, text)` method preserves the existing success/error
  SweetAlert2 configuration, acknowledgement text, disabled default button styling
  and Metronic primary/danger button classes.
- Replaced all 53 notification calls across Site, Plant, Unit, System, Asset,
  Component and Measurement with injected-service delegation. Removed the seven
  private `showAlert()` implementations and their direct SweetAlert2 imports.
  Page messages, validation, API requests, modal lifecycle, cancellation,
  refreshes and delete confirmations are retained. No templates, visual styles,
  dependencies, API contracts or storage were changed.
- Verified by TypeScript AST comparison that the extracted alert body matches
  every original implementation and all retained page members and existing
  constructor dependencies are unchanged apart from service delegation.
  Application source has 63 fewer net lines, including the new service.
- Production build with strict Angular templates, project lint, normal test
  TypeScript compilation, stale-reference searches and `git diff --check` passed.
  Existing 2.77 MB initial-bundle warning and four CSS selector warnings remain.
  Browser tests, manual visual review and live backend integration were not run
  for this behavior-preserving extraction; no new tests were added.

### 2026-10-11 - Extract pure taxonomy hierarchy transformations

- Added four small, typed functions in `core/utils/taxonomy-hierarchy.ts` and
  adopted them in Unit, System, Asset, Component and Measurement. Removed the
  repeated parent-option, relationship-map and Plant employer-map loops and four
  private employer traversal methods. Kept existing shared entity models.
- Preserved saved/zero IDs, null-parent guards, duplicate-label order, nullish
  hierarchy-label fallback, employer ID/name normalization, missing-ancestor
  behavior and fresh map replacement on reload. HTTP order, keyed RequestState,
  errors/retries, repaint calls, forms, writes and pagination behavior remain
  page-owned. No endpoints, storage, dependencies, templates or styles changed.
- Five pages decreased from 1,478 to 1,311 lines; the helper adds 55 lines:
  **112 fewer production source lines**, excluding tests and documentation.
  AST comparison verified 159 unaffected class members and identical loader API
  calls, request keys, continuations and repaint calls against the original source.
- Added 11 helper tests for labels/ordering, unsaved IDs, zero/null handling,
  duplicate IDs, employer snapshots, independent maps and broken ancestor chains.
  Added seven feature-level HTTP regressions exercising all five real pages:
  sequential loading, inherited display/filter values, fresh reload/search state,
  ancestor read failure/retry and cancellation on page destruction.
- Verified production build with strict Angular templates, project lint, normal
  test TypeScript compilation, `git diff --check`, and **81** ChromeHeadless tests
  (18 new hierarchy regressions plus 63 existing shared tests). Existing 2.77 MB
  initial-bundle warning and four CSS selector warnings remain. HTTP was mocked;
  live API integration and manual visual inspection were not performed. This is
  a reuse/maintenance improvement; runtime performance gains were not measured.

### 2026-10-11 - Asset taxonomy hierarchy filename

- Renamed the helper to `core/utils/asset-taxonomy-hierarchy.ts`, its adjacent
  spec to `asset-taxonomy-hierarchy.spec.ts`, and the feature-level hierarchy spec
  to `pages/asset-taxonomy/asset-taxonomy-hierarchy.spec.ts`. Updated all five page
  imports, the helper spec import and current documentation. Function names and
  behavior are unchanged; paths in the preceding extraction log are historical.
- Verified strict Angular compilation, normal test TypeScript compilation,
  project lint, `git diff --check`, absence of stale application imports and
  removal of the old filenames. Production build and browser tests were not
  rerun for this filename-only change; the prior 81 tests cover the extraction.

### 2026-10-11 - Compose shared taxonomy save/delete lifecycles

- Added a 52-line `AssetTaxonomyMutations` helper under `core/utils/` and composed
  one instance in each of the seven page constructors. Replaced all nine save
  subscriptions and nine confirmed-delete pipelines. Saving remains a page-local
  boolean; requests remain lazy factories so the saving/deletion lock is set
  before invoking the API. No new injectable service or global state was added.
- Shared cancellation, duplicate/saved-ID guards, save failure repaint/alert and
  deletion finalizers. Pages retain their explicit validation, payloads, requests,
  success messages and callbacks. Kept Measurement Type's refresh-before-dismiss
  ordering and success-only type-filter clearing; Plant Type still dismisses and
  alerts before refreshing. Modal dismissal guards and destruction cleanup remain.
- AST comparison against the captured pre-edit source verified 209 untouched
  members, all nine save validation/payload prefixes and success callbacks, and
  all nine delete callbacks, endpoint/table associations and error fallbacks.
  Pages decreased from 1,814 to 1,659 lines, plus 52 helper lines: **103 fewer
  production source lines**, excluding tests and documentation.
- Added nine helper tests and 38 real-page mutation regressions covering all
  nine entities: POST/PUT serialization and zero/null/tag handling, callback order,
  duplicate submits/deletes, failed-edit value retention and retry, failed-delete
  unlock/retry, cancellation on destruction, validation and the shared local
  saving flag across Plant's two forms. API reads are stubbed and writes use the
  real API service with mocked HTTP; the helper tests also verify page independence
  and deletion locks across row snapshot replacement.
- Verified production build with strict templates, project lint, normal test
  TypeScript compilation, `git diff --check` and **128** focused ChromeHeadless
  tests (47 new mutation regressions plus 81 existing hierarchy/shared tests).
  Existing 2.77 MB initial-bundle warning and four CSS selector warnings remain.
  No templates, styles, models, endpoints, serialization, dependencies or storage
  changed. Live API integration and manual visual inspection were not performed.
  Runtime performance gains were not measured; this change reduces duplication.

### 2026-10-11 - Danger hover color for shared table delete buttons

- Changed the shared table-record Delete button from `btn-active-color-primary`
  to Metronic's `btn-active-color-danger`. Delete text/icons now use the danger
  token on hover/focus; the Edit button retains its existing primary treatment.
  No custom CSS, action logic, disabled/loading behavior or dependencies changed.
- Verified the installed Metronic Sass and compiled hover rules apply
  `var(--bs-text-danger)` to both the button and its icon. All five existing
  table-record ChromeHeadless tests passed, including action emission and
  independent table instances; `git diff --check` passed. No new tests were
  added for this class-only change. Production build and manual hover/visual
  inspection were not rerun.

### 2026-10-11 - Vibration asset taxonomy measurement drawer

- Replaced the layout's demo Activity Drawer usage with the standalone reusable
  taxonomy drawer, mounted only on vibration routes. Replaced its navbar toggle
  with an accessible measurement selector button. Saved values are owned by the
  layout-provided vibration selection service; other consumers supply independent
  values. Preserved the vendor Activity Drawer source as a reference.
- Adapted the local `customize/select-plant.html` and its JS dependencies, using
  the existing Metronic Select2 directive and the documented installed PrimeNG
  18 Tree checkbox/filter/template/selection APIs. Used actual taxonomy reads,
  typed ID-based hierarchy conversion and the requested single-Unit constraint.
  No endpoints, API payloads, dependencies, chart behavior or persistent storage
  changed. Reset commits an empty selection, per the user's clarification.
- Added 17 tests: three hierarchy builder tests, two feature-state tests and 12
  actual-drawer tests with PrimeNG/Select2/Metronic. Verified zero IDs, incomplete
  chains, cross-Component selection within one Unit, locks/releases, filtered and
  keyboard selection, save/dismiss/reset, restoration/reconciliation, retries,
  cancellation/overlay/store cleanup, initial open mount, Escape/focus return,
  light/dark Metronic token colors and mobile/desktop rendered layout bounds.
- Verified **91 ChromeHeadless tests** (17 new plus existing shared/Select2 tests),
  production build with strict templates, project lint, normal test TypeScript
  compilation and `git diff --check`. Initial bundle is 2.78 MB; the existing
  initial-budget warning and four CSS selector warnings remain. Reduced adapter
  Sass extension expansion to avoid increasing the theme bundle unnecessarily.
- API behavior was exercised using mocked existing service reads. Live
  authenticated API integration and manual screenshots were not verified:
  computer-use reported no available browser surface and could not open IAB.
  Theme and responsive acceptance were verified through actual ChromeHeadless
  rendering/computed styles, including isolated 320px and 1280px viewports.

### 2026-10-11 - Immediate measurement selection and clickable branch labels

- Updated the taxonomy drawer per the user's six UI refinements. The header and
  empty-state icon now use Metronic's `data` Keenicon (connected hierarchy nodes).
  Select2 continues selecting Plant. Removed Save, Clear selection and the
  "Other Units are locked" message; Reset remains in the footer.
- Measurement selection and unselection immediately emit the updated saved IDs
  without closing the drawer. Deselecting the last measurement saves `null` and
  releases the Unit restriction. Changing Plant immediately clears the previous
  saved measurements; restoring/loading a saved selection does not emit writes.
  Pending/failed reads cannot trigger selection commits. Session scope and
  backend/storage behavior are unchanged.
- Branch names and level badges are part of a Metronic button that toggles
  PrimeNG's documented `expanded` node state; stop propagation prevents branch
  selection or duplicate toggling. Empty branches have disabled label buttons.
  The existing tree arrows and keyboard selection remain available.
- Updated the adjacent tests and README for immediate commits, persistence after
  dismissal, Plant switching and removed controls. Added real-template coverage
  for expanding/collapsing all four branch levels and filtered branch copies
  without saving a branch. Verified **18 focused ChromeHeadless tests**, including
  light/dark theme tokens, mobile/desktop layout bounds and cancellation/focus
  regressions; production build, project lint, normal test TypeScript compilation
  and `git diff --check` passed. Existing 2.78 MB initial-bundle and four selector
  warnings remain. Live API integration/manual screenshots were not repeated.

### 2026-10-11 - Remove taxonomy drawer heading and instructions

- Removed the drawer body's "Measurements" heading and single-Unit instruction
  paragraph at the user's request. Removed the tree's corresponding
  `aria-describedby` reference so it does not point to a deleted element; retained
  the tree's accessible name. Kept Metronic spacing between Plant and the selected
  count. Selection behavior, Reset and session state are unchanged.
- All **13 existing drawer ChromeHeadless tests** and `git diff --check` passed,
  including theme and mobile/desktop rendering checks. No new tests were added
  for this text-only change; production build and manual screenshots were not
  repeated.

### 2026-10-11 - Restore taxonomy drawer Measurements heading

- Restored the "Measurements" heading above the selected count at the user's
  request, using its original Metronic classes and spacing. The instruction
  paragraph remains removed. Verified the focused template edit and
  `git diff --check`; tests/build were not repeated for this static heading edit.

### 2026-10-11 - Match Plant and Measurements drawer headings

- Presented Plant using the same `h4`, `fs-6`, `fw-bold` and `mb-3` Metronic
  styling as Measurements, retaining its associated select label. The first
  section uses the existing card-body padding; Measurements retains the gap
  after the Plant selector. Verified matching markup and `git diff --check`;
  tests/build were not repeated for this static typography edit.

### 2026-10-11 - DARP text-only branding

- Replaced Metronic product text in captions, tooltips, demo content and both
  environments' `appThemeName`. Authenticated browser titles now end in ` - DARP`.
- The user clarified that this change is text only and must not touch images.
  The working tree was clean at the start, with original image references and
  no DARP SVG assets from the previous attempt. Preserved all image tags/alt text,
  SVG markup, asset files, logo sources and favicon; no images were created.
- Retained framework imports/classes/types, `data-kt-name`, genuine vendor URLs
  and accurate technical documentation. No styling, storage or behavior changed.
- Verified strict Angular compilation and `git diff --check`. Compared image
  markup with HEAD (normalizing Git working-tree line endings) and confirmed
  no image-asset changes. Build/browser tests were not repeated for text edits.

### 2026-10-11 - Replace product logos with the supplied official DARP design

- The user explicitly authorized replacing the earlier product images using
  their supplied DARP logo, including a standalone D for former M-only placements
  and white lettering without a slogan wherever the old logo was white. This
  supersedes the previous image-preservation restriction for these logo placements.
- Traced the original image's dark/red silhouettes into transparent native SVG
  paths, preserving the emblem gap, red node/connector, custom DARP lettering and
  red A triangle. Dark variants share identical paths and change only dark fills
  to white. Removed slogan text from compact assets; colors are from the supplied
  brand, not a new UI palette. Original uploaded file and vendor assets are intact.
- Sidebar wordmarks retain the previous 269x56 intrinsic canvas and `h-25px`;
  small variants retain 27x18 and the existing `h-20px`/`h-30px` utilities. The
  login asset reuses the former stacked symbol/wordmark composition and 240x147
  canvas with `h-75px`. White/red lettering replaces the old login logo.
- Updated sidebar light/dark/collapsed variants, mobile header, login aside and
  both splash logo references. Early splash CSS mirrors existing Metronic theme
  visibility classes so only one D appears before global theme CSS loads. Created
  transparent D favicon frames at 16/32/48/64px; linked the ICO and provided the
  same file at `src/favicon.ico`, already included by Angular's asset configuration.
- Verified production build, project lint, `git diff --check`, SVG XML/asset
  references, identical geometry between color variants and valid ICO PNG frames.
  Visually inspected rendered light/dark SVG contact sheets and all favicon sizes.
  Six temporary ChromeHeadless acceptance tests passed: four desktop checks for
  real sidebar theme/minimize behavior, original logo dimensions and first-paint
  splash visibility, plus two mobile checks for a single correctly sized header D
  and the unchanged hidden login aside. Temporary specs/configuration were removed.
- Existing 2.78 MB initial-bundle warning and four CSS selector warnings remain.
  Full authenticated-page screenshots were unavailable because computer-use had
  no browser surfaces and IAB creation failed. Live API integration was not tested;
  API contracts/storage/layout scripts and non-logo imagery were unchanged.
- Imagegen built-in extraction was tried with instructions to preserve exact
  reference shapes, remove background/slogans and recolor dark parts white.
  Raster results had edge/alpha defects and were not used in the application;
  pending unused variants were cancelled. Final assets are native SVG traces of
  the original reference, with ICO frames rasterized from the D-only SVG.

### 2026-10-12 - Add Execute button to asset taxonomy drawer

- Added a Metronic primary Execute button beside Reset in the drawer footer. The
  user specified button-only behavior for now, so it has no click action. It is
  disabled while the hierarchy loads, matching Reset; measurement changes still
  save immediately.
- Verified the production build and `git diff --check`. Existing 2.78 MB initial
  bundle and four selector warnings remain. No browser visual inspection was run
  for this focused template change.

### 2026-10-12 - Vibration analysis tabs, date ranges and Execute integration

- Converted all five vibration pages to the shared workspace. The reusable
  PrimeNG Tabs component includes close buttons, keyboard navigation, scroll
  controls, focus recovery and active-only panel rendering with Metronic styling.
- Execute now validates and emits a complete measurement snapshot, creates a new
  active tab in the current route and closes the drawer. Each tab retains its
  own selection details and From/To dates; later drawer changes/reset cannot alter
  earlier tabs. Plant display metadata is excluded. Tabs persist only in the
  layout's in-memory service and are independent across the five routes.
- Added the Flatpickr 4.6.13 runtime to use Metronic's existing date picker styles.
  Linked date controls enforce inclusive bounds, support restoring tab values and
  clean up calendars on close/switch. Base CSS is layered below Metronic.
- Reused the original synthetic Time Domain waveform under each tab's header,
  labeled Sample data and adapted to Metronic theme tokens. Deferred chart mount
  until the tab is projected to prevent zero-width initialization. Dates/IDs are
  prepared for future integration; no analysis backend or date filtering of the
  sample waveform was added.
- Restored the missing shared `asset-taxonomy-fixture.ts` referenced by the
  existing drawer/tree specs, and added execution/state/workspace behavior tests.
- Verified 29 focused ChromeHeadless tests using real PrimeNG Tabs/Tree, Select2,
  Flatpickr and ECharts. They cover repeated Execute, hierarchy snapshots, stale
  and cross-Unit rejection, route isolation, date bounds/restoration, close/focus,
  disposal, light/dark tokens and live responsive rendering at 320/768/1280px.
  Production build, project lint, test TypeScript and `git diff --check` passed.
  The existing initial-bundle warning is now 2.80 MB; four existing CSS selector
  warnings remain. Live authenticated API integration was not exercised.

### 2026-10-12 - Review of vibration-analysis folder responsibilities

- Re-read all three standalone components, their templates, README and six
  workspace integration test cases, alongside the tab/date adapters, state service
  and models, to explain the current architecture. Confirmed the workspace
  coordinates service-owned tabs, the panel presents one tab and emits date
  changes, and the chart renders the same synthetic preview in all five routes.
- Tab values persist in layout memory; inactive chart/calendar instances are
  destroyed and recreated on activation, so chart zoom is not retained as tab
  state. No implementation changed and no tests/build were rerun for this review;
  the validation results in the preceding entry remain the latest execution.

### 2026-10-12 - Rename and generalize the shared analysis panel

- Renamed the shared UI folder to `shared/components/analysis-panel/`, with
  `AnalysisWorkspaceComponent`, `AnalysisPanelComponent` and generic models in
  `core/models/analysis-panel.model.ts`. Updated imports and component documentation;
  no source references to the former `vibration-analysis` path remain.
- The shared workspace receives tabs/title/active ID as inputs and emits selection,
  close, activation and date actions. Consumer-provided chart templates receive the
  active tab. It no longer injects Vibration state or hardcodes its sample chart.
- Moved Vibration's state connection and sample chart to the separate reusable
  `shared/components/vibration-workspace/` wrapper. All five existing Vibration
  pages use it; route constants now live in `core/models/vibration-page.model.ts`.
  No API contracts, browser storage or visual design were changed.
- Verified 12 ChromeHeadless tests: two independent-consumer tests without feature
  services, six existing workspace integration tests (including responsive/theme
  behavior) and four selection-service tests. Project lint and `git diff --check`
  passed. Production build passed after clearing stale Angular compiler cache
  with `ng cache clean`; the existing 2.80 MB initial-bundle warning and four CSS
  selector warnings remain. Live authenticated API integration was not tested.

### 2026-10-12 - Verify vibration-workspace consumers before deletion

- Inspected live routing, `VibrationModule`, all five page templates and the
  workspace component/template. The folder is actively used: `VibrationModule`
  imports `VibrationWorkspaceComponent`, and Overview, Time Domain, Frequency
  Domain, Bode Analysis and Rotor Position render `app-vibration-workspace`.
  The `cm/vibration` route lazy-loads that module.
- The wrapper connects `VibrationSelectionService` to the shared analysis
  workspace and supplies the Vibration sample chart. Retained the folder because
  the user's deletion request was conditional on it being unused. No application
  source changed; no build/tests were rerun for this source dependency audit.

### 2026-10-12 - Transfer Vibration workspace connections and delete the wrapper

- The user explicitly requested transferring every wrapper connection to
  `AnalysisWorkspaceComponent` and deleting the former wrapper folder. All five
  Vibration pages now import/render the shared workspace directly, passing the
  existing layout-owned selection service through the generic
  `AnalysisWorkspaceState` input. The workspace delegates drawer opening, tab
  activation/closing and date updates; the service still owns session state.
- Moved the unchanged sample-chart implementation into `analysis-panel/` and
  transferred its template into the workspace behind explicit `showSampleChart`.
  Projected charts override the sample, and existing input/output consumers still
  work without any Vibration provider. Moved the six integration cases beside
  the shared workspace and removed the old folder and its remaining wrapper files.
- Verified no source references to the former wrapper path/class/selector remain,
  and the folder is absent. Production build, project lint, `git diff --check`
  and all 12 focused ChromeHeadless tests passed (two independent consumers, six
  workspace/drawer/chart integration cases, four selection-service cases).
  Browser tests include theme tokens, responsive widths, dates, focus and disposal.
  The existing 2.80 MB initial-bundle warning and four selector warnings remain.
  No live authenticated API integration or manual screenshots were performed;
  API contracts and browser-storage behavior did not change.

### 2026-10-12 - Compact selected measurements and restrict selection to one Asset

- Replaced repeated per-Measurement hierarchy/metadata grids with one shared
  Unit - System - Asset line and semantic Component groups. Each Component name
  appears once beside its Measurement names and optional tags, matching the
  requested `106 - Gas System - SGT 600` / `Bearing1 X vi508` presentation.
  Metronic utilities provide all visuals; no new CSS or libraries were added.
  Full display snapshots remain available for later chart/backend integration.
- Narrowed the drawer restriction from one Unit to one Asset. Tree nodes carry
  their ancestor Asset ID; multiple Components within that Asset remain allowed.
  Other Assets, including siblings in the same Unit, are disabled for normal,
  keyboard and filtered selection. Removing the last Measurement releases the
  restriction. Restore reconciles older mixed-Asset values without writing during
  loading; Execute independently rejects mixed-Asset snapshots. Saved selection
  shape, existing API reads and in-memory storage are unchanged.
- Updated the existing workspace tests to use an external selection opener,
  matching the current template's absent internal button. Guarded its remaining
  optional focus reference to avoid an exception when closing the last tab.
- Verified 32 focused ChromeHeadless tests, including shared hierarchy appearing
  once, Component grouping/tab changes, same-Unit Asset restrictions, restoration,
  keyboard/filter interaction, Metronic light/dark colors, responsive rendering at
  320/768/1280px, independent consumers, dates, chart disposal and feature state.
  Production build, project lint and git diff --check passed. Existing 2.80 MB
  initial-bundle and four CSS selector warnings remain. Live authenticated API
  integration and manual application screenshots were not performed.

### 2026-10-12 - Nest the analysis panel inside the analysis workspace folder

- Moved the workspace, adjacent specs, sample chart and README into
  `shared/components/analysis-workspace-panel/`. Its nested `analysis-panel/`
  folder now contains the panel component and template. Updated the workspace,
  date-picker and Vibration module imports and current documentation paths.
  Component names, selectors, templates, styling and runtime behavior are unchanged.
- Verified all nine existing workspace ChromeHeadless tests, project lint,
  production build and `git diff --check`. The first build used stale cached
  page imports; clearing the Angular cache resolved it. Existing 2.80 MB initial
  bundle and four CSS selector warnings remain. No live API integration or
  manual visual inspection was performed for this folder-only change.

### 2026-10-12 - Render an individually titled chart for each selected Measurement

- The opt-in workspace sample template now renders one independent ECharts
  instance for each Measurement in the executed tab snapshot, tracked by its ID.
  Replaced the static Time domain heading with that Measurement's
  Unit - System - Asset path. Added Component/Measurement names and optional tags
  below each heading to distinguish charts within the same Asset. Unique heading
  IDs and existing Metronic classes provide accessible labels and responsive
  spacing/separators. The compact selection header remains shared above them.
- Consumer-projected chart templates retain their existing tab context and
  precedence. The synthetic sample waveform, Execute/tab/date behavior, API reads
  and in-memory storage are unchanged; no measurement-specific backend was added.
- Verified all ten workspace ChromeHeadless tests, including three simultaneous
  charts, per-selection headings/details, independent zoom, disposal on switch
  and close, restored selections, light/dark heading colors and responsive layout
  at 320/768/1280px. Production build, project lint and `git diff --check` passed.
  Existing 2.80 MB initial-bundle and four CSS selector warnings remain. Live API
  integration and manual application screenshots were not performed.

### 2026-10-12 - Simplify chart headings and use one date range picker

- Chart headings now display only Component - Measurement names. Removed the
  repeated Unit/System/Asset path, Sample data badge, optional tag and waveform
  description above charts. Removed the Component/Measurement groups from the
  panel header and their unused grouping logic; retained the shared hierarchy
  summary and selection count. Preserved the user's live header label/order edits.
- Replaced the two linked Flatpickr controls with one input/calendar using the
  installed runtime's documented range mode and existing Metronic visuals.
  Complete ranges emit the same local `{ from, to }` model; reverse selections
  are sorted by the picker and same-day ranges work. Partial selections do not
  update tab state and restore the committed range when dismissed. External
  values synchronize silently; the single calendar is destroyed on tab close/switch.
- Verified eight focused ChromeHeadless tests for real calendar clicks, partial
  dismissal, same-day/reverse selection, button/keyboard opening, tab-date
  persistence, chart disposal, simplified accessible headings, light/dark colors
  and responsive layout at 320/768/1280px. Production build, project lint and
  `git diff --check` passed. Existing 2.80 MB initial-bundle and four CSS selector
  warnings remain. Chart data is still synthetic; no API/storage contracts changed.
  Live API integration and manual application screenshots were not performed.

### 2026-10-12 - Include Measurement tags in chart headings

- Added the optional Measurement tag after the Component - Measurement title,
  for example `Bearing 1 - X vi508`. Untagged Measurements retain their existing
  title without a trailing separator or placeholder. Existing Metronic styling,
  accessible heading IDs, header summary and single date-range picker are unchanged.
- Updated the current documentation and existing presentation assertions for both
  tagged and untagged Measurements. All four focused ChromeHeadless presentation
  tests, project lint and `git diff --check` passed. Production build and live API
  validation were not repeated for this focused title change.

### 2026-10-12 - Muted styling for Measurement tags

- Wrapped the optional chart-heading tag in a span using Metronic's
  `text-gray-500 fw-normal` utilities. Component/Measurement names retain the
  existing bold heading; tag text remains part of its accessible label.
- All four focused presentation ChromeHeadless tests and `git diff --check`
  passed, including computed tag color/weight in light and dark themes and
  existing mobile/desktop layout checks. No custom CSS was added. Production
  build, project lint and live API validation were not repeated for this styling change.

### 2026-10-12 - Show Site, Plant Type and Plant in the analysis header

- Replaced Selected Items with the executed Plant's existing `hierarchyLabel`
  (Site - Plant Type - Plant), already used in its Select2 options. The execution
  builder captures it as optional `plantLabel` on `AssetTaxonomyExecution`, so
  the existing service clone retains each tab's original heading independently
  of later selections/resets. Measurement chains continue resolving solely by IDs.
- A missing/blank joined label falls back to the Plant name; independent shared
  consumers without `plantLabel` use Analysis. Added Metronic text wrapping to
  the heading. No endpoint, API write contract, extra read or browser storage was added.
- Verified 26 focused ChromeHeadless tests across the drawer, execution builder,
  state service and workspace: emitted label, both Plants/tab restoration, zero
  IDs, snapshot independence, missing-label fallback and existing date/chart/theme/
  responsive behavior. Production build, project lint and `git diff --check`
  passed. Existing 2.80 MB initial-bundle and four CSS selector warnings remain.
  Live authenticated API labels and manual screenshots were not tested.

### 2026-10-12 - Toggle between stacked and two-column analysis charts

- Added a Metronic icon button above the shared workspace's sample charts with
  accessible toggle state and action tooltips. Default layout remains one chart
  per row; the alternate layout displays two equal-width charts per row from
  768px upward, with one column on mobile. Zero/one-chart tabs disable the button
  and keep full width. The preference survives tab switches in workspace memory
  and resets when that workspace is destroyed; no storage or API change was added.
- Reused Metronic grid/button/icons and existing ECharts resize behavior without
  custom CSS or new dependencies. Switching layout preserves chart instances and
  independent zoom. Consumer-projected chart templates retain their own layout.
- Verified all six focused ChromeHeadless presentation tests, covering toggle
  reversal, single-chart disabling, tab switches, retained instances/zoom,
  light/dark button colors, dates/headings, and actual one/two-column geometry
  and resized canvases at 320/768/1280px. The theme check waits for Metronic's
  existing color transition before comparing computed button styles.
  Production build, project lint and git diff --check passed. Existing 2.80 MB
  initial-bundle and four CSS selector warnings remain. Live API integration and
  manual application screenshots were not performed.

### 2026-10-12 - Match Measurement drawer close to the New Target reference

- Matched the close control in `Mapna-UIUX/utilities/modals/forms/new-target.html`
  using `btn btn-sm btn-icon btn-active-color-primary` and the reference's
  `i.ki-duotone.ki-cross.fs-1` with both icon paths. Preserved the drawer's existing
  alignment, native button accessibility, initial focus and Angular close action.
  Metronic's hover/focus rules change icon color to the primary token without
  adding the former light-primary background. No custom CSS was introduced.
- Inspected the reference markup/CSS and the app's Metronic button mixin/theme
  selectors. All 14 existing drawer ChromeHeadless tests, project lint and
  git diff --check passed, including focus return, themes and responsive drawer
  geometry. Actual pointer-hover screenshots, production build and live API
  integration were not repeated for this focused markup/styling change.

### 2026-10-12 - Dedicated Frequency Domain sample spectrum

- Added a page-specific standalone sample chart and isolated synthetic spectrum
  data under `pages/cm/vibration/frequency-domain/`. The chart uses Frequency (Hz)
  from 0 to 125 Hz and nonnegative peak Amplitude (mm/s) with 10 Hz/2 mm/s and
  25 Hz/1 mm/s peaks matching the existing time signal. The tooltip includes Hz
  and mm/s peak. No selected Measurement FFT or backend integration is implied.
- Added the generic optional `measurementChartContent` template input to the
  shared workspace's existing per-Measurement chart layout. Frequency Domain
  passes its own chart through this input; headings/tags, date range, one/two
  columns, single-chart disable behavior and chart lifecycle remain shared.
  The default time preview and whole-tab projected template precedence remain
  intact. No custom styling, dependencies, API or browser storage were added.
- Verified ten ChromeHeadless tests: four page-specific cases covering real
  ECharts frequency axes/data/tooltip, independent zoom, dates, tab cleanup,
  Metronic theme tokens and responsive one/two-column geometry at 320/768/1280px,
  plus six existing Time Domain workspace presentation cases. Stabilized the
  existing button-color test by flushing initial computed styles before waiting
  for Metronic's transition, retaining its assertions. Production build, project
  lint and git diff --check passed. Existing 2.80 MB initial-bundle and four CSS
  selector warnings remain. No live API validation or manual screenshots ran.

### 2026-10-12 - Gray hover for the chart layout toggle

- Preserved the user's plain `btn btn-sm btn-icon` styling and added Metronic's
  `btn-active-light`, also used by the header controls. Hover/focus now uses the
  theme's light gray background token; idle state has no permanent tinted fill.
  Chart layout, disabled behavior and native button accessibility are unchanged.
- Verified the existing Metronic theme/mixin hover selectors, all ten focused
  Time/Frequency Domain ChromeHeadless tests, project lint and git diff --check.
  No custom CSS was added. Production build, manual pointer-hover screenshots
  and live API integration were not repeated for this one-class styling change.
