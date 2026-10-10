# DARP form modal

`FormModalComponent` is exported by `SharedModule`. It presents all 18 add/edit
dialogs in asset taxonomy: Site, Plant, Plant Type, Unit, System, Asset, Component,
Measurement and Measurement Type.

Use it inside an existing `NgbModal` template. Project the complete page-owned
`NgForm`, retaining its fields, validation and `(ngSubmit)` handler. Set `formId`
to the projected form's DOM ID; the shared submit button uses native HTML form
association to submit that form once. Each form ID must be unique in the document.

Required inputs are `title` and `formId`. Optional inputs are `description`,
`submitLabel`, `saving`, `cancelId` and `submitId`. Connect `(dismiss)` to the
template's `modal.dismiss($event)`; reasons remain `Cross click` and `cancel`.
Saving disables the submit button and displays the existing Metronic indicator.
The page continues to own API requests, errors, confirmation and modal lifecycle.

The component uses existing Metronic classes without custom visual styling.
Projected selects retain the existing Select2 directive and modal dropdown parent;
do not initialize Select2 again. For a named form, set its `aria-labelledby` to
`formId + '_title'`. When opening a new dialog, the same ID can also be supplied
as ng-bootstrap's `ariaLabelledBy` option.
