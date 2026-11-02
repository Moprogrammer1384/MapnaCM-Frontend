# DARP frontend: project memory

Updated: **2026-11-02 (Asia/Tehran)**. Read this file before each task, then inspect the relevant live source. Repository rules are in [AGENTS.md](AGENTS.md); `CLAUDE.md` is historical.

## Working rules and memory maintenance

- Scope: Angular UI. Reuse existing APIs; missing endpoints do not block UI work or authorize backend/database changes. For a new page without an API, use isolated frontend state/mock data. Do not invent endpoints or add browser persistence without an established requirement.
- Preserve existing work and check `git status` before editing. Follow strict TypeScript/templates, UTF-8, two-space indentation, single-quoted TypeScript and adjacent Jasmine specs.
- New services belong in `src/app/core/services/`; reusable components in `src/app/shared/components/`. Existing legacy locations are not a precedent for new code.
- Most pages port designs from `C:/Users/hafez/Documents/Mapna/Mapna-UIUX/customize`. Read the requested HTML and CSS/JS dependencies; port page content only. Angular provides the shared header/sidebar/footer. Build from scratch only when requested.
- Keep this memory compact (roughly 250 lines): update the relevant current section and date, replace superseded facts, and record only useful validation/limitations. Do not append task transcripts, repeated test reports, abandoned approaches, old file moves, archive checksums or temporary debugging details. Detailed technical explanations belong in feature READMEs; implementation history belongs in Git.
- Distinguish source-verified behavior, automated tests and live integration. A successful build does not establish a working live API or manual visual acceptance.

## Mandatory Styling Policy — METRONIC ONLY

Adopted 2026-10-10. This policy supersedes conflicting older styling/library restrictions.

- **Metronic is the only visual design system.** Reuse its components, templates, utility classes, tokens, mixins, styling APIs, assets and existing behavior.
- PrimeNG and Spartan UI may provide functionality only, with default visuals disabled or reliably replaced. Centralized Metronic-token-based adapters are allowed; reusable adapters belong under `shared/components/`.
- Prohibited: PrimeNG default themes/presets, Spartan default visuals, independent palettes, arbitrary Tailwind values, competing component visuals, fragile global overrides, third-party source modifications, and copied styles without checking Metronic tokens.
- Preserve Metronic typography, colors, component sizing, spacing, borders, radii, shadows, light/dark themes, responsiveness, accessibility and hover/focus/disabled/loading/error states. Verify visual consistency and absence of regressions.
- If a library cannot reliably disable or replace its default styling, stop, explain the limitation and request approval before proceeding.
- Keep existing `data-kt-*` hooks and theme/plugin lifecycle behavior. Angular owns state, bindings, forms and integration; do not invent replacement theme behavior or initialize plugins twice.

## Project map

DARP uses Angular 18, TypeScript 5.5, RxJS 7, Metronic 8 demo1, Bootstrap 5 and ng-bootstrap 17. The npm package is `darp`; Angular target/output remain `demo1` / `dist/demo1`. Most features use NgModules; several shared components are standalone.

| Location | Purpose / integration status |
| --- | --- |
| `src/app/pages/routing.ts` | Authenticated lazy feature routes; public auth/error routes are in `app-routing.module.ts` |
| `src/app/_metronic/layout/` | Shared chrome, hardcoded sidebar/menu, route breadcrumbs and theme initialization |
| `src/app/pages/asset-taxonomy/` | Real API: Site, Plant/Plant Type, Unit, System, Asset, Component, Measurement |
| `src/app/core/models/asset-taxonomy.model.ts` | One shared entity model per taxonomy entity, used by API, tables and editable forms |
| `src/app/core/services/asset-taxonomy-api.service.ts` | `AssetApiService`: taxonomy CRUD and employer lookups |
| `src/app/pages/user/` | Real users CRUD, activity toggle, role assignment, details and audit |
| `src/app/pages/role/` | Real role list/create; role details still use the remote vendor demo API |
| `src/app/pages/permission/` | Remote vendor demo CRUD; permission details have no implementation logic |
| `src/app/modules/auth/` | Real login/profile restoration/revocation; registration/password reset still lack real backend endpoints |
| `src/app/modules/account/` | Real profile overview/edit/avatar; other settings retain demo behavior |
| `src/app/modules/crud/` | Legacy DataTables/modal/confirmation wrapper used by users and demo screens |
| `src/app/pages/cm/vibration/` | Five analysis routes sharing a measurement workspace; Time/Frequency use the real API, other routes retain previews |
| `src/app/shared/components/` | Reusable tables, forms, feedback, drawer, tabs, date/time controls and analysis/chart UI |
| `src/app/core/services/vibration/` | Vibration data access, with separate `time-domain/` and `frequency-domain/` processing |
| `src/app/_fake/` | Mixed demo implementations; some services make actual outgoing requests to Keenthemes |
| `src/styles.scss`, `src/assets/` | Metronic Sass, plugins, icons, media and generated chart assets |
| `src/app/graphify-out/` | Generated historical reports; not application source |

Product names/titles use **DARP**. Preserve its supplied emblem/custom SVG lettering, red details, white dark-surface variants and standalone D compact logo; sidebar has no slogan. See [logo mappings](src/assets/media/logos/README.md).

## API contracts, errors and authentication

- Development API: `https://localhost:7064/api/v1`; production API: `http://185.81.99.32:758/api/v1`. Both environment files disable mocks. Frontend deployment origin: `http://185.81.99.32:759/`.
- Services use `environment.apiUrl`. Business routes follow `/api/v1/<Controller>/<Action>`; do not infer new endpoints from that convention.
- `ApiEnvelope<T>` contains `success`, optional `message`, `errors`, `data`. Success uses HTTP 200; business rejection uses HTTP 400. Continue checking `success` for older hosts returning business failures with HTTP 200. Non-2xx bodies are in `HttpErrorResponse.error`.
- **Display errors through `core/utils/api-error.ts::apiErrorMessage`.** Prefer the server message/validation details over Angular's generic `Http failure response ... 400 OK`. Supports envelope/MVC/ProblemDetails/text bodies and meaningful fallbacks without recursively exposing data/trace metadata. Preserve original HTTP errors/statuses for control flow.
- User creation's `data.canRedefine=true` handshake works for HTTP 200 and 400. Require the existing explicit admin confirmation before resubmitting with `redefineIfExists: true`; never retry automatically.
- `criteriaToHttpParams` serializes PascalCase query keys, including indexed filters/sorts. Preserve the backend enum spelling `Conatains`. Paginated data is `{ items, totalCount }`. Taxonomy IDs are numbers; Identity user/employer IDs are strings.
- Auth stores its session under `${environment.appVersion}-${environment.USERDATA_KEY}`. Changing `appVersion` also affects versioned layout keys. Login maps token/refresh token/expiry, then loads `/User/Profile`; guard/session watch enforce expiry. Refresh tokens are stored/revoked, with no automatic renewal flow.
- `AuthInterceptor` attaches JWT only to the configured API prefix. It reads storage through `getStoredAuthToken()` and resolves `AuthService` lazily via `Injector` on API 401; preserve this to avoid the NG0200 circular dependency. Logout clears local auth before best-effort revocation.
- Profile writes use multipart `FirstName`, `LastName`, `Email`, `PhoneNumber`, `Address`, optional `Avatar`. Allowed avatars: JPEG/PNG/WEBP, up to 2 MB; successful save/removal refreshes the shared auth user.
- Backend authorization remains authoritative; the current menu/buttons are not a complete role-based authorization UI. Browser configuration is public: never put credentials or secrets there.

## Taxonomy models and UI patterns

- Hierarchy: **Site -> Plant -> Unit -> System -> Asset -> Component -> Measurement**. Plant Type is managed on the Plant page; successful type mutations refresh both types and Plants.
- Keep one shared model per entity; do not reintroduce separate Row/Form/Payload models. Service write types derive allowed fields with `Pick` and explicitly serialize established request fields, excluding joined labels/audit data.
- Relationships and filters bind saved IDs, never display labels. Parent/hierarchy/employer labels are presentation data. Unsaved entity IDs are optional; incomplete form selections may be null. Table snapshots are readonly; edit forms copy values.
- Plant has optional `employerId` and employer-name snapshot. Candidates come from `getEmployerOptions()` / users in role `Employer`. Descendants inherit employer by numeric parent maps; employer filters compare Identity IDs. Pure helpers are in `core/utils/asset-taxonomy-hierarchy.ts`.
- **Site:** Location was removed. Latitude/longitude are signed numbers (binary64), null only for blank forms; validate finite latitude [-90,90] and longitude [-180,180]. Keep signs/precision in state, sorting and payloads. `geo-coordinate-display.ts` adds N/S/E/W only when rendering.
- **Elevation:** required integer meters in [-500,9000], with zero/negative values valid; reject fractions, missing and non-finite values.
- Asset/Component/Measurement have optional free-text `tag`; missing tags render blank, and clearing submits `''`.
- **Measurement Type was removed.** Measurement has one table/modal, finite required Sensitivity (zero/negative/decimals valid), Component selection and optional Tag. Add/Update sends name/tag/componentId/sensitivity, plus id on Update. Do not restore type/unit joins; analysis quantity/unit comes from vibration metadata.
- All taxonomy entities use the existing API. Component/Measurement browser-storage implementations are obsolete.

Taxonomy uses `<app-data-table>` and `TablePagination<T>` under `shared/components/data-table/`, exported through `SharedModule`; it does **not** use the legacy `<app-crud>` DataTables plugin.

- `TablePagination` owns immutable snapshots, cached filtering/sorting/paging, explicit search keys, exact filters, three-state sorting and delete confirmation. Preserve native numeric sorting and IDs. Default sizes: 10/25/50/100; table rendering/paginator must not independently paginate or sort again.
- `AssetApiService` currently requests up to 10,000 rows for client-side operations; this is a limit, not unlimited pagination.
- Each page owns its `RequestState` and `AssetTaxonomyMutations`. Reads cancel stale keyed requests; shared feedback distinguishes loading/error/retry/empty states. Pages retain payload validation, success messages, reload order and modal ownership.
- Each entity has one shared Add/Edit `NgForm` inside `FormModalComponent`. Saving blocks duplicate submits and dismissal. Failed saves retain values and restore actions; successful saves close/refresh. Delete runs after confirmation, locks by row ID and releases locks on success/error/cancellation.
- Use `MetronicAlertService` for taxonomy notifications and `apiErrorMessage` for API failures. Legacy DataTables consumers also settle their loading callback when reads fail.
- Shared `appTrimmedRequired` / `appFiniteNumber` validators provide field feedback after touch/submission. Preserve labels, unique form/control IDs, ARIA associations and Select2 validation state.

## Theme and plugin integration

- PrimeNG uses `METRONIC_PRIMENG_CONFIG` in `shared/components/metronic-primeng.config.ts`: empty preset, lower `primeng` CSS layer and Metronic-token adapters. Do not add a default PrimeNG theme, PrimeIcons, PrimeFlex or Tailwind stylesheet.
- Select2 is supplied globally and enhanced through the existing directive (`data-control="select2"`, `data-kt-select2="true"`, or `appSelect2`). Preserve Angular numeric values, async options, validation, dropdown parent and cleanup. Do not initialize again or load a second jQuery instance. See [Select2 guide](src/app/_metronic/shared/select2/README.md).
- Theme switches update `data-bs-theme` in place, preserving workspace/chart state. Existing theme/layout/language preferences remain; many custom labels are English. Use `<app-keenicon>` and existing Metronic utility classes.
- The local Metronic drawer has an intentional resize-state fix: `_update()` reads the same `data-kt-drawer-${name}` attribute written by `_show()`. Preserve it; regression coverage includes Plant dropdown/selection during resize. Physical Samsung verification remains outstanding.

## Vibration workspace and data

- Routes: overview, time-domain, frequency-domain, bode-analysis, rotor-position. All render `AnalysisWorkspaceComponent` from `shared/components/analysis-workspace-panel/`; its generic measurement/date header lives in nested `analysis-panel/` and accepts consumer state/chart templates without injecting a Vibration service.
- Layout-scoped `VibrationSelectionService` owns selection and independent tabs/settings/date/time values per route. Every Execute creates a new snapshot/tab; visible Analysis numbering is independent per page. This state survives route navigation within the layout and ends on reload/logout/layout destruction.
- The measurement drawer commits selections immediately, supports multiple measurements within **one Asset** (across its Components), and clears saved selection on Plant change/Reset. Dismissal retains the latest selection; Execute validates fresh hierarchy data, opens a tab and closes the drawer.
- Preserve the combined Flatpickr range picker: one input, independent start/end hour/minute fields and Apply/Cancel. Values are local `YYYY-MM-DDTHH:mm`; unconfirmed drafts are discarded. Time/Frequency charts wait for explicit Apply, including an unchanged confirmed range.
- AnalysisWorkspace enables `ClosableTabsComponent.preserveContent`: visited panels retain requests/data/workers/charts/calendars/settings/zoom across tab switches; unvisited tabs stay lazy. Bind panels to their owning tab, not the current active tab. Close/workspace destruction disposes resources; mounted views are not retained across route changes.
- The only persisted analysis preference is 1/2 chart columns under `darp.chart-layout-columns`, via `ChartLayoutPreferenceService`. Mobile remains one column; single-chart tabs stay full width without overwriting the preference. No measurement data is persisted.
- Time/Frequency use `VIBRATION_DATA_SOURCE` / `VibrationApiService`. Other analysis routes retain synthetic previews. The old Book1 runtime fixture/repetition is removed; do not restore a fake-data fallback.
- **One waveform request:** `GET /TimeDomain/Get` per measurement/range, sending only `MeasurementId`, `From`, `To`. Convert local timestamps to UTC ISO once; From inclusive, To exclusive. No frontend `GetAnalysis`, batching, MaxPoints/ChartWidthPixels, point ceiling, allocation, truncation, chunk download or fetch-on-zoom. Backend owns limits/resolution.
- Quantity/unit metadata and seconds X coordinates come from the response. Raw processing requires representation=raw, all original points, at least three samples, no gaps/internal breakBefore markers and compatible native metadata. Preserve X/Y precision and `timeOriginUtc`.
- Time Domain summaries use server statistics/count/extrema and compatible unit scaling only; respect gaps and never apply calculus to summary extrema. Quantity changes retain/label the available summary quantity. Frequency Domain shows an FFT input error for summary/discontinuous/insufficient input and does not start a worker or make another read.
- Existing mechanical formulas, axes, controls and meaning must remain intact when changing data integration. Settings/unit/quantity/window/RPM/zoom operate on loaded data without HTTP requests.

### Available days

`core/services/time-availability.service.ts` exposes `TIME_AVAILABILITY_SOURCE`; models are in `core/models/time-availability.model.ts`. This is shared cross-module infrastructure.

- Existing endpoint: `GET /TimeDomain/GetAvailability`, repeated `MeasurementIds` (1–16), optional calendar From/To window (1–366 days). Day labels use Asia/Tehran; To is exclusive. Do not UTC-convert calendar labels.
- Only proven `commonRanges` (intersection) enable dates; never use union/dataBounds to fill holes. Unknown/loading/failed/empty discovery keeps dates disabled, with Retry on failure.
- Data bounds constrain navigation only. Out-of-coverage months fetch metadata; mounted-component caching retains drafts/view, cancels stale reads and resets for changed measurements. Restrict days only; do not impose availability rules on hours/minutes. Other analysis pages retain their unrestricted picker.

### Numerical organization and chart lifecycle

- Time-sampled preparation, calculus, quantity/unit conversion, amplitude and statistics belong in `core/services/vibration/time-domain/`. FFT/spectrum processing and FFT-only resampling/windowing belong in `frequency-domain/`; parent folder holds data access.
- Keep full precision in raw arrays, Float64 calculations, workers/caches, chart coordinates/reference bounds. Format measured display text to **two decimal places** only; sample counts stay integers. Never feed display strings back into calculations.
- Time Domain amplitude is a full-record statistic/reference, not a sine multiplier on waveform samples. Integration represents AC dynamic motion. Frequency amplitude is line RMS/0p/pp, not PSD/broadband RMS; Order requires explicit positive RPM.
- Preserve worker/session ownership, bounded caches, stale-result guards, OnPush `markForCheck`, chart resize/theme updates and resource disposal. Theme/layout/settings updates retain ECharts instances/zoom.
- Reusable ECharts host: `_metronic/partials/content/widgets/charts/Apache-Echarts/`. Pass application options to it; do not rewrite generated gallery wrappers. Generated assets/wrappers are managed by `tools/`.
- Detailed numerical assumptions/formulas and component APIs: [vibration](src/app/core/services/vibration/README.md), [Frequency Domain](src/app/core/services/vibration/frequency-domain/README.md), [workspace](src/app/shared/components/analysis-workspace-panel/README.md), [drawer](src/app/shared/components/asset-taxonomy-drawer/README.md).

## Validation and deployment

Run from the repository root:

| Command | Purpose |
| --- | --- |
| `npm ci` | Install locked dependencies when needed |
| `npm start` | Development server, localhost:4200 |
| `npm run build` | Production output, dist/demo1 |
| `npm run build -- --output-path=tmp/<task>/build` | Validate without replacing an existing publish build |
| `npm run lint` | Project TypeScript/template lint |
| `npx tsc --project tsconfig.spec.json --noEmit` | Compile test TypeScript |
| `npm test -- --watch=false --browsers=ChromeHeadless --include=src/path/example.spec.ts` | Focused browser tests; repeat --include as needed |
| `npm run verify:apache-echarts` / `npm run test:apache-echarts` | Generated chart checks when relevant |
| `npm run rtl` | Generate RTL styles |

- Tests use Jasmine/TestBed/Karma; no E2E target or minimum coverage threshold is configured. CLI discovers specs without `require.context`. `--include` limits execution, but `tsconfig.spec.json` still compiles all specs; unrelated type errors may require an isolated temporary test tsconfig. Do not leave `fit`/`fdescribe` or weaken checks.
- Latest application validation, **2026-11-02**: 71 focused ChromeHeadless tests, full lint, test TypeScript and production build passed for shared API-error handling (including PlantType/Add 400 OK, retained form/retry, deletion locks, auth handshake and rendered alerts). Output: `tmp/api-error-review-2026-11-02/build`. Existing warnings: approximately 2.80 MB initial bundle and four CSS optimizer selectors.
- These results use controlled HTTP responses; the user's actual rejected PlantType response and latest authenticated manual browser/API integration remain unverified. Do not infer a specific business cause from HTTP 400 alone.
- IIS uses `src/web.config`, root base href and Static Content/Default Document/URL Rewrite. Serve builds over HTTP, not `file://`. See [deployment guide](docs/iis-deployment.md). Its historical release/archive references may predate current `/api/v1` configuration; rebuild current source before packaging. Remote deployment/API/CORS remain unverified for current source.
- **2026-11-02 memory cleanup:** consolidated current decisions, removed obsolete/duplicate history and Git conflict markers, and rechecked key claims against source. Documentation-only; application files and prior validation results were preserved.
