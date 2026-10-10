# DARP shared data table

Import the existing `SharedModule` to use `<app-data-table>`. Pass one typed
`TablePagination<T>` instance and optional `tableId`; handle `editRecord` and
`deleteRecord` in the host page. The table record and pagination children remain
independently exported. All seven taxonomy pages use this implementation.

- `p-table` renders rows and empty states; `pButton` provides accessible sort and
  row-action buttons. The existing typed helper retains cached filtering, custom
  comparators, three-state sorting, immutable snapshots and pagination state.
- `p-paginator` supplies the five-number page window and First/Previous/Next/Last
  navigation. Its zero-based page events are converted to the helper's one-based
  page numbers. No second data-paging state or PrimeNG table paginator is enabled.
- `p-select` supplies page-size selection, keyboard support and overlay cleanup.
  Select2 is not initialized on this control; other page forms keep their existing
  Select2 integration. The footer stays outside the table's horizontal scroller.

PrimeNG **18.0.2** supports the installed Angular 18 version. It has no public
unstyled input: `METRONIC_PRIMENG_CONFIG` uses an empty visual preset and places
PrimeNG structural CSS in a lower cascade layer. No PrimeNG theme, PrimeIcons,
PrimeFlex or Tailwind stylesheet is installed/imported. The namespaced adapter
partial is imported after the Metronic Sass in `src/styles.scss`; it reuses the
theme's pagination, form, dropdown, focus, spacing and color variables. Light/dark
colors follow the existing `data-bs-theme` tokens.

`tableId` remains on the PrimeNG table host; PrimeNG generates its internal native
table ID. Query `#<tableId> table` when inspecting the native table. The required
input and readonly action payloads retain the original public component contract.

Run the existing tests with:

```text
npm test -- --watch=false --browsers=ChromeHeadless --include=src/app/shared/components/data-table/**/*.spec.ts --include=src/app/pages/asset-taxonomy/**/*.spec.ts --include=src/app/_metronic/shared/select2/select2.directive.spec.ts
```

References: [PrimeNG table](https://v18.primeng.org/table),
[paginator](https://v18.primeng.org/paginator), and
[theme CSS layers](https://v18.primeng.org/theming#csslayer).
