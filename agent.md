# DARP frontend: project memory

Updated: **2026-11-04 (Asia/Tehran)**. Read this file before each task, then inspect the relevant live source. Repository rules are in [AGENTS.md](AGENTS.md); `CLAUDE.md` is historical.

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
| `src/app/pages/cm/vibration/` | Shared measurement workspace; Time/Frequency/Bode use APIs; Overview/Rotor await dedicated charts |
| `src/app/shared/components/` | Reusable tables, forms, feedback, drawer, tabs, date/time controls and analysis/chart UI |
| `src/app/core/services/vibration/` | All HTTP adapters in `api/`; separate `time-domain/`, `frequency-domain/`, `bode-analysis/` logic |
| `src/app/_fake/` | Mixed demo implementations; some services make actual outgoing requests to Keenthemes |
| `src/styles.scss`, `src/assets/` | Metronic Sass, plugins, icons, media and generated chart assets |
| `src/app/graphify-out/` | Generated historical reports; not application source |

Product names/titles use **DARP**. Preserve its supplied emblem/custom SVG lettering, red details, white dark-surface variants and standalone D compact logo; sidebar has no slogan. See [logo mappings](src/assets/media/logos/README.md).

General number display **2026-11-03**: standalone `NumberFormatPipe` in `shared/pipes/number-format.pipe.ts` is exported by `SharedModule`; templates use `value | numberFormat`. Its co-located `formatNumber` helper supports chart callbacks with the same two-decimal display and negative-zero normalization. This replaces the analysis-specific formatter; source values retain full precision. Angular app/template and test TypeScript compilation plus 18 focused pipe/chart/panel browser tests passed. Focused lint passed with an 8 GB Node heap after default-heap lint runs exhausted memory; live API/visual behavior was not rechecked.

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

- Routes: overview, time-domain, frequency-domain, bode-analysis, orbit-analysis, rotor-position. All render `AnalysisWorkspaceComponent` from `shared/components/analysis-workspace-panel/`; its generic measurement/date header lives in nested `analysis-panel/` and accepts consumer state/chart templates without injecting a Vibration service.
- Layout-scoped `VibrationSelectionService` owns selection and independent tabs/settings/date/time values per route. Every Execute creates a new snapshot/tab; visible Analysis numbering is independent per page. This state survives route navigation within the layout and ends on reload/logout/layout destruction.
- The measurement drawer commits selections immediately, supports multiple measurements within **one Asset** (across its Components), and clears saved selection on Plant change/Reset. Dismissal retains the latest selection; Execute validates fresh hierarchy data, opens a tab and closes the drawer.
- Time/Frequency preserve the combined Flatpickr range picker: one input, independent start/end hour/minute fields and Apply/Cancel. Values are local `YYYY-MM-DDTHH:mm`; unconfirmed drafts are discarded. These charts wait for explicit Apply, including an unchanged confirmed range. Bode uses discrete event selection as specified below.
- AnalysisWorkspace enables `ClosableTabsComponent.preserveContent`: visited panels retain requests/data/workers/charts/calendars/settings/zoom across tab switches; unvisited tabs stay lazy. Bind panels to their owning tab, not the current active tab. Close/workspace destruction disposes resources; mounted views are not retained across route changes.
- The only persisted analysis preference is 1/2 chart columns under `darp.chart-layout-columns`, via `ChartLayoutPreferenceService`. Mobile remains one column; single-chart tabs stay full width without overwriting the preference. No measurement data is persisted.
- Active Vibration HTTP adapters live in `core/services/vibration/api/`; files/classes identify Vibration, the backend feature and data/availability purpose. Time/Frequency use `VIBRATION_DATA_SOURCE` / `VibrationTimeDomainApiService`; Bode uses `BODE_DATA_SOURCE` / `VibrationBodeAnalysisApiService`, with no fixture fallback. Both features have explicitly named availability adapters. The unused legacy adapter was removed on 2026-11-03; reference checks and app/test TypeScript compilation passed after removal (browser tests/build not rerun for this unused-file deletion). See [API map](src/app/core/services/vibration/api/README.md). Overview/Rotor Position have no charts pending future dedicated implementations.
- **2026-11-03:** removed the synthetic chart component/data generator and the workspace sample-chart option at the user's request. Overview/Rotor Position retain their selection/tabs/date/time/settings UI without charts or chart-layout controls. Dedicated charts are deferred until explicitly requested. Time/Frequency/Bode continue to supply their own templates. App/template and test TypeScript compilation, focused lint (8 GB heap) and 17 workspace/API/date/Bode browser tests passed, including chart-free Overview/Rotor coverage; ECharts emitted two zero-size test-DOM warnings. Production build and manual live visual/API acceptance were not rerun for this removal.
- **One waveform request:** `GET /TimeDomain/Get` per measurement/range, sending only `MeasurementId`, `From`, `To`. Convert local timestamps to UTC ISO once; From inclusive, To exclusive. No frontend `GetAnalysis`, batching, MaxPoints/ChartWidthPixels, point ceiling, allocation, truncation, chunk download or fetch-on-zoom. Backend owns limits/resolution.
- Quantity/unit metadata and seconds X coordinates come from the response. Raw processing requires representation=raw, all original points, at least three samples, no gaps/internal breakBefore markers and compatible native metadata. Preserve X/Y precision and `timeOriginUtc`.
- Time Domain summaries use server statistics/count/extrema and compatible unit scaling only; respect gaps and never apply calculus to summary extrema. Quantity changes retain/label the available summary quantity. Frequency Domain shows an FFT input error for summary/discontinuous/insufficient input and does not start a worker or make another read.
- Existing mechanical formulas, axes, controls and meaning must remain intact when changing data integration. Settings/unit/quantity/window/RPM/zoom operate on loaded data without HTTP requests.

### Bode Analysis (2026-11-02)

- Keep the existing workspace, tabs, measurements and chart layout. **Latest user decision:** Bode selects one acquisition with an optional single-date filter and searchable Select2 Event time. Default is all dates; the cross icon clears Date and restores every event. Selecting an event immediately loads it and never forces a date filter. No textual All dates button, range, editable hour/minute, inline event list or extra Apply. Time/Frequency retain their range/Apply flow; existing tabs retain event/settings/zoom.
- Reusable standalone OnPush `shared/components/vibration-bode-chart/` uses the existing ECharts host: amplitude above phase, aligned speed grids and linked cursor/zoom. Wrapped phase breaks false 0/360° connecting lines but keeps every observation visible with markers, including isolated points between consecutive wraps.
- `core/services/vibration/bode-analysis/` owns pure analysis and its data-source contract/token; HTTP/availability adapters are in sibling `api/`; models live in core/models. Explicitly authorized backend scope: `C:/Users/hafez/Documents/Mapna/BackEnd`, separate BodeAnalyses domain folder, BodeAnalysis API and independent Vibration.BodeRun/BodePoint tables. Runtime reads `/BodeAnalysis/Get` and `/BodeAnalysis/GetAvailability`; never use TimeDomain availability for Bode or join separate events into a single trace.
- **Bode is API/database-only.** All former Sample data UI, alternate-window fields/actions, local adapter/data files and frontend importer were removed (2026-11-03). Automated test doubles/numeric fixtures live only in `src/testing/` and are never imported by app code. Current DB has 36 runs/36,360 points: first 6 exact workbook data, later 30 scaled by 0.981–1.0195, all Velocity/mm/s RMS. Existing times/counts/IDs/types/audit were retained; CoastDown/Trip reverse the pattern and differing counts use interpolation. Backend `--bode-reference --all-events` uses a flushed backup, one EF transaction and full verification. Native metadata belongs to each acquisition; future Displacement is supported. See backend `docs/Vibration-Bode-API.md`; original `--bode --verify` intentionally detects this revised dataset as different.
- EventType persists as Startup=1, CoastDown=2, Trip=3, LoadChange=4. Text badges use Metronic success/info/danger/warning opposite the sensor heading inside `app-vibration-bode-chart`. Bode passes title/tag/titleId and opts out of the workspace heading via `showMeasurementTitle=false`, preserving the section's label ID; other pages retain workspace headings. The redundant chart Event selector is removed; workspace Event time selects the acquisition. Reusable `shared/components/vibration-event-picker/` colors proven dates blue, disables data-less dates and offers searchable times; empty/loading/error metadata cannot enable a selection.
- User confirmed RPM/1X but does not know the phase lead/lag convention. **Quantity stays readonly and follows incoming metadata, not a hardcoded Velocity** (clarified 2026-11-02). Native Displacement/Velocity/Acceleration are supported; the source workbook declares Velocity. Adapters declare a matching quantity/unit and supply RMS amplitudes in that unit; do not reinterpret values or convert physical quantity/phase. Compatible unit changes, harmonic-amplitude conversion and optional phase unwrapping remain available. The first channel supplies shared controls; each chart retains its own native profile for mixed inputs. See [Bode methods/provenance](src/app/core/services/vibration/bode-analysis/README.md).

### Orbit Analysis (2026-11-04)

- User-authorized backend/database feature: C:/Users/hafez/Documents/Mapna/BackEnd. Orbit-Analysis folders sit beside TimeDomain/Bode in Domain Entities, Application Command/Query, EF Configurations/Repositories/Migrations, Dapper and presentation. [Backend contract/history/storage](../../BackEnd/docs/Vibration-Orbit-API.md). Shared backend edits are Orbit registration/model/migrations and affected tests only.
- **Current selection model: NO waveform range or Apply.** The independent standalone OrbitAcquisitionPickerComponent owns Daily/Weekly/Monthly/Quarterly cadence, stored history discovery, optional single-date filtering, immediate event selection, caching/cancellation/retry. It reuses Bode's event picker through the neutral dateSelectionContent/dateSelectionTitle slots in workspace/panel. Final responsive row order: **Acquisition period, Date, Event time**, each col-md-4; mobile stacks them. The acquisition-count/one-second explanatory row was removed at user request. Cadence changes clear the selected capture/date filter but retain analytical controls/settings. Bode default layout/behavior stays intact.
- Route/menu remain immediately after Bode, with the standard empty workspace and immutable per-page tabs. Drawer requires one distinct standalone-name X/Y pair per Component in one Asset; multiple complete pairs are supported. Incomplete/duplicate/ambiguous axes disable Execute. The separate probe selector stays removed. All analysis selects remain in app-analysis-panel above charts.
- ORBIT_DATA_SOURCE resolves only to VibrationOrbitAnalysisApiService. Get takes XMeasurementId/YMeasurementId/Period/PeriodStart and returns that exact stored acquisition or null. It never sends From/To, picks a latest record from a range, joins frames or aggregates daily records into longer histories. The independent availability adapter takes IDs/Period and intersects exact pair/period keys from stored metadata; only proven acquisitions enable dates. These are not Time Domain calendar windows.
- Tables: Vibration.OrbitAcquisition, OrbitPoint, optional OrbitKeyphasor, OrbitPulse. Period enum is Daily=1, Weekly=2, Monthly=3, Quarterly=4 plus a Tehran PeriodStart date; unique pair/period/start prevents duplicate slots. Every NEW acquisition is exactly one second, SampleCount=SampleRateHz and uniform full-precision points. UTC capture bounds are immutable signal metadata, not UI ranges. Legacy unclassified rows are preserved by additive schema upgrade only; new ingestion cannot create them. Creation audit belongs only to the root. Admin ingestion validates live IDs and received synchronized inputs and writes atomically with ordered probe locks/bounded batches. Nullable speed/reference is never inferred.
- **Current local history:** 2026-08-04 to exclusive 2026-11-04, all 92 days including Fridays. Per real pair (1/4, 1004/1005, 1006/1007): 92 Daily, 13 complete Weekly, 3 Monthly, 1 Quarterly. Total 327 frames, 2092800 points, 327 reference channels, 16677 edges. Frames are 6400 Hz/6400 points/1 second; a supplied edge at time=1 brackets final waveform points. Prior 474 short development frames were fully backed up and replaced in one transaction; Time Domain/Bode counts stayed unchanged. Full header/time/X/Y/voltage/pulse verification passed. Reference/authoring assets exist only in backend tools; no startup seed or frontend acquisition data files remain.
- Numerical preparation, units, reference interpolation and positive fractional/integer nX remain isolated in the frontend Orbit pipeline. No runtime voltage/edge/clock/RPM synthesis. Missing/null/invalid reference keeps Direct and both charts visible, with an explicit fallback if order filtering was requested. analysis.filter records the actual filter. Hiding markers retains valid phase reference for filtering.
- Existing ECharts polar/X-Y waveform charts remain side by side at md+, stacked on mobile. Hover/tap and arrows/Home/End follow points with synchronized markers; settings/theme/scale/tab retention, cancellation and cleanup remain. Probe mounting/view/clearance/runout are unspecified; no correction or severity limits are invented. [Frontend ownership/methods](src/app/core/services/vibration/orbit-analysis/README.md).
- Verified for this change: app/template and test TypeScript compile; 98 Vibration checks including isolated SQL; 32 frontend API/component/workspace/date/tracking checks plus 19 affected-layout regressions after the final field-order swap. Live authenticated API reads verified exact first/last captures for every pair/cadence, all 92 dates, full 6400-point arrays/reference and rejection of the former From/To API. 54 current Presentation HTTP/architecture checks and focused lint passed. Optimized production build passed (hash 208998c3a4107444, tmp/orbit-api/build; font inlining disabled for this validation only), with the existing 3.09 MB initial-budget and four CSS selector warnings. Known hidden-panel ECharts size warnings remain. The user's active API/dev processes were preserved; an attempted second API instance was closed by the occupied port. Hardware integration/production deployment have not been tested.

### Available days

`core/services/time-availability.service.ts` exposes only the shared `TimeAvailabilitySource` contract and `TIME_AVAILABILITY_SOURCE` token; models are in `core/models/time-availability.model.ts`. Its default HTTP implementation is `vibration/api/vibration-time-domain-availability-api.service.ts`; the Bode page provides `VibrationBodeAnalysisAvailabilityApiService`.

- Existing endpoint: `GET /TimeDomain/GetAvailability`, repeated `MeasurementIds` (1–16), optional calendar From/To window (1–366 days). Day labels use Asia/Tehran; To is exclusive. Do not UTC-convert calendar labels.
- Time/Frequency enable only proven `commonRanges` (intersection); never use union/dataBounds to fill holes. Bode enables start dates proven by exact common acquisition metadata, preserving full events across midnight/month windows. Unknown/loading/failed/empty discovery blocks selection, with Retry on failure.
- Data bounds constrain navigation only. Out-of-coverage months fetch metadata; mounted-component caching retains drafts/view, cancels stale reads and resets for changed measurements. Time/Frequency restrict days only and keep unrestricted hours/minutes. Bode's page-scoped source supplies exact common event times to its discrete picker.
- Bode's all-dates list covers the full common history: the availability wrapper fills missing metadata windows through the existing API in requests of at most 366 days, deduplicates events and keeps selection blocked until history is complete. Failure retains Retry for the failed window; replacing/destroying the view cancels reads. Clearing or filtering Date is local and does not fetch chart data.

### Numerical organization and chart lifecycle

- Time-sampled preparation, calculus, quantity/unit conversion, amplitude and statistics belong in `core/services/vibration/time-domain/`. FFT/spectrum processing and FFT-only resampling/windowing belong in `frequency-domain/`; HTTP implementations belong in `api/`.
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
- Latest frontend validation, **2026-11-03**: after consolidating/renaming Vibration HTTP adapters in `api/`, 38 focused API/page/calendar/chart tests, test TypeScript compilation and lint passed. Controlled HTTP coverage includes the default availability token, Time/Frequency requests and Bode's own availability/data adapters through single-click event selection with incoming Displacement metadata. The stale all-five-pages range test now covers the four range pages plus Bode's discrete flow. Optimized production build passed with only font inlining disabled for that temporary validation run (hash `730ca0139d407bac`, output `tmp/vibration-api-organization-2026-11-03/build-offline`); normal builds reached index generation but Google Fonts downloads failed with socket hang up. Project configuration stayed unchanged; the existing 2.80 MB initial-bundle warning remains. Earlier Bode production-fixture exclusion, optional-date/Select2 and numerical checks remain the regression baseline. This reorganization did not recheck authenticated live APIs or manual visual acceptance.
- Backend validation **2026-11-03**: 83 Vibration non-SQL checks and 7 reference-pattern/import checks passed, including multi-run SQL rollback, exact first runs, scaled later runs and preserved timestamps/audit. Independent verification matched all 109,080 numeric values as binary64 and all 36,360 times/identities against source plans/backups; waveform/summary counts/last IDs stayed unchanged. The earlier 55 Presentation/actual-host checks remain the HTTP baseline. Frontend TestBed uses controlled HTTP responses; full authenticated manual browser acceptance and the original rejected PlantType response remain unverified. Do not infer a business cause from HTTP 400 alone.
- IIS uses `src/web.config`, root base href and Static Content/Default Document/URL Rewrite. Serve builds over HTTP, not `file://`. See [deployment guide](docs/iis-deployment.md). Its historical release/archive references may predate current `/api/v1` configuration; rebuild current source before packaging. Remote deployment/API/CORS remain unverified for current source.

User acceptance (2026-11-04): the user viewed the live Orbit page and confirmed the result was OK after the final field-order change.
