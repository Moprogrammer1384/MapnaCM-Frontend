# DARP asset taxonomy drawer

Standalone reusable component, replacing the demo Activity Drawer on the five
`/cm/vibration` pages. Import `AssetTaxonomyDrawerComponent` in the consuming
NgModule or standalone component.

```html
<app-asset-taxonomy-drawer
  drawerId="kt_my_measurements"
  [visible]="drawerOpen"
  [selection]="selection"
  (selectionSave)="selection = $event"
  (executed)="openAnalysis($event)"
  (closed)="drawerOpen = false">
</app-asset-taxonomy-drawer>
```

Use a unique `drawerId`, fixed for the lifetime of the instance. Each consumer owns
its saved `AssetTaxonomySelection | null`; the drawer does not inject vibration
state or write browser storage. Selection consists of plant ID, Unit ID and
measurement IDs. Other features can provide independent values and save handlers.

- Metronic's existing `DrawerComponent` supplies positioning, responsive width,
  animation and overlay dismissal. Angular controls opening/closing, with CDK
  focus trapping, Escape dismissal and focus return. Destroying the component
  clears its requests, observer, overlay and Metronic store entry.
- Existing `AssetApiService` reads Plants, Units, Systems, Assets, Components and
  Measurements on opening. No new endpoints or mock application data. Failed
  reads show the shared retry feedback; close/destroy cancels pending reads.
- Plant selection uses the existing Metronic Select2 directive. The hierarchy
  joins records by their numeric parent IDs and preserves ID zero. Missing
  ancestor links and unsaved records are omitted.
- PrimeNG's Tree supplies expansion, checkbox selection, search and keyboard
  navigation. Only measurements are selectable, with propagation disabled. The
  first selection locks other Assets, even within the same Unit; clearing the
  last selection releases them.
  Filtered node copies are included in restriction updates. Clicking a branch
  label toggles its documented `expanded` property without selecting the branch.
- Each measurement selection/unselection emits `selectionSave` immediately and
  leaves the drawer open. Deselecting the last measurement emits `null`. Changing
  Plant clears the previous saved measurements immediately. Close keeps the latest
  value; opening reloads and restores the caller's saved values. Save and Clear
  selection buttons are absent; the footer contains Reset and Execute. Execute
  emits `executed` with an `AssetTaxonomyExecution` and closes the drawer. It is
  disabled during loading/errors and until at least one measurement is selected.
  The execution resolves a fresh display snapshot from the loaded hierarchy by
  IDs: Unit, System, Asset, Component, Measurement, tags, type, unit and sensitivity.
  Measurement chains do not include joined hierarchy labels. The selected Plant's
  `hierarchyLabel` is copied separately as `plantLabel` (Site - Plant Type - Plant)
  for the analysis header, falling back to its name if the label is unavailable.
  Reset emits `null`, clears the plant and measurements and leaves the drawer open.
  Missing/reparented saved records require review; they do not overwrite the saved
  value automatically.
- `VibrationSelectionService`, provided by `LayoutComponent`, retains the
  vibration selection and separate analysis tabs per vibration route across
  navigation, including a visit to another feature. Each Execute opens another
  tab with copied details and independent dates; see `../analysis-workspace-panel/README.md`.
  Its state ends when the authenticated layout is destroyed (logout/reload).
  Vibration pages may inject it and read `selection()` when integrating real charts.

The shared PrimeNG configuration supplies an empty visual preset; no default
theme or PrimeIcons is added. `_metronic-taxonomy-tree.scss` is a scoped adapter
using Metronic tokens, Sass variables and utilities in both light/dark modes.
PrimeNG 18 does not reliably apply checkbox highlight or node `styleClass`, so
the adapter uses the documented `aria-checked` state and our own node template
markers instead. Third-party sources are unchanged.

References:
[PrimeNG Tree](https://primeng.dev/tree),
[installed-version examples/API](https://v18.primeng.org/tree).
Uses the documented checkbox binding, templates, selection-propagation flags,
filter and node-selectable options; no custom tree renderer is implemented.
Layout/content were adapted from Metronic Activity Drawer and the local
`Mapna-UIUX/customize/select-plant.html` reference. Its JavaScript's older
single-Component constraint was replaced with a single-Unit rule, then narrowed
to the requested single-Asset rule on 2026-10-12. Multiple Components within
one Asset remain selectable. Execute rejects cross-Asset selections as well.
The header and empty-state `data` Keenicon depicts a parent with connected children.
