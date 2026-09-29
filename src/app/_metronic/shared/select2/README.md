# Select2 in Angular templates

Import `SharedModule` into the NgModule declaring the page. Existing template
markup using `data-control="select2"` or `data-kt-select2="true"` is enhanced
automatically. `appSelect2` is an equivalent attribute for new selects.

```html
<select class="form-select form-select-solid" data-control="select2"
  data-placeholder="Select a Site" name="siteId" [(ngModel)]="siteId" required>
  <option [ngValue]="null" disabled>Select a Site</option>
  <option *ngFor="let site of sites" [ngValue]="site.id">{{ site.name }}</option>
</select>
```

- Use Angular's `ngModel` or reactive forms as usual, including `[ngValue]`
  for numbers/objects, multiple selection, validation, resets and disabled state.
- Search is enabled unless `data-hide-search="true"` is present.
- `data-placeholder`, `data-allow-clear`, `data-width` and
  `data-dropdown-parent` follow Select2's configuration. For a single-select
  placeholder, provide a blank or disabled first option.
- Dropdowns automatically attach inside the nearest modal or Metronic menu.
  Explicit dropdown parents must exist when the select is created.
- The directive initializes/destroys each Angular view and refreshes options
  loaded asynchronously. Do not initialize these selects again in page scripts.
- The plugin uses the global jQuery loaded by `angular.json`. Importing another
  jQuery instance for Select2 would leave it without the registered plugin.
- Select2's base CSS loads before the existing Metronic Bootstrap 5 overrides.
  Version 4.1 supplies the `selectionCssClass` support used by that theme.

Run the integration checks with:

```sh
npm test -- --watch=false --browsers=ChromeHeadless --include=src/app/_metronic/shared/select2/select2.directive.spec.ts --include=src/app/pages/asset-taxonomy/plant/plant.component.spec.ts
```
