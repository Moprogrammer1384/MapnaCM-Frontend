import { ChangeDetectorRef, Component, DestroyRef, inject, OnDestroy, OnInit, TemplateRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NgbModal, NgbModalOptions, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Sensor, SensorType } from 'src/app/core/models/asset-taxonomy/sensor.model';
import { SensorApiService } from 'src/app/core/services/asset-taxonomy/sensor-api.service';
import { MetronicAlertService } from 'src/app/core/services/metronic-alert.service';
import { AssetTaxonomyMutations } from 'src/app/core/utils/asset-taxonomy-mutations';
import { TablePagination } from 'src/app/shared/components/data-table/pagination/table-pagination';
import { RequestState } from 'src/app/shared/components/request-state/request-state';

@Component({
  selector: 'app-sensor',
  templateUrl: './sensor.component.html',
  styleUrls: ['./sensor.component.scss'],
})
export class SensorComponent implements OnInit, OnDestroy {
  readonly modalConfig: NgbModalOptions = {
    modalDialogClass: 'modal-dialog modal-dialog-centered mw-650px',
    beforeDismiss: () => !this.saving,
  };
  readonly sensors = new TablePagination<Sensor>([], [
    { key: 'name', title: 'Name', class: 'min-w-150px' },
    { key: 'typeName', title: 'Type', class: 'min-w-150px' },
  ], { searchKeys: ['name', 'typeName'] });
  readonly types = new TablePagination<SensorType>([], [
    { key: 'name', title: 'Name', class: 'min-w-150px' },
  ], { searchKeys: ['name'] });
  readonly listState = new RequestState();
  readonly typesState = new RequestState();
  typeOptions: SensorType[] = [];
  sensorForm: Sensor = { name: '', sensorTypeId: null };
  typeForm: SensorType = { name: '' };
  saving = false;
  private activeModal?: NgbModalRef;
  private readonly mutations: AssetTaxonomyMutations;

  get canAdd(): boolean {
    return !this.saving && this.listState.ready && this.typesState.ready && this.typeOptions.length > 0;
  }

  constructor(private modalService: NgbModal, private api: SensorApiService, private alerts: MetronicAlertService, private cdr: ChangeDetectorRef) {
    this.mutations = new AssetTaxonomyMutations(this, inject(DestroyRef), alerts, cdr);
  }

  ngOnInit(): void {
    this.sensors.onConfirmedDelete = (sensor) => this.mutations.delete(sensor, this.sensors, (id) => this.api.deleteSensor(id), () => {
      this.alerts.show('success', 'Deleted!', 'Sensor deleted successfully.');
      this.loadSensors();
    }, 'Unable to delete the sensor.');
    this.types.onConfirmedDelete = (type) => this.mutations.delete(type, this.types, (id) => this.api.deleteType(id), () => {
      this.alerts.show('success', 'Deleted!', 'Sensor type deleted successfully.');
      this.loadTypes();
      this.loadSensors();
    }, 'Unable to delete the sensor type.');
    this.loadTypes();
    this.loadSensors();
  }

  ngOnDestroy(): void {
    this.listState.destroy();
    this.typesState.destroy();
    this.saving = false;
    this.activeModal?.dismiss('page destroyed');
  }

  loadSensors(): void {
    this.listState.track(this.api.getSensors(), 'Unable to load sensors.').subscribe({
      next: (rows) => { this.sensors.setRows(rows); this.cdr.detectChanges(); },
      error: () => this.cdr.detectChanges(),
    });
  }

  loadTypes(): void {
    this.typesState.track(this.api.getTypes(), 'Unable to load sensor types.').subscribe({
      next: (rows) => { this.typeOptions = rows; this.types.setRows(rows); this.cdr.detectChanges(); },
      error: () => this.cdr.detectChanges(),
    });
  }

  openSensor(content: TemplateRef<unknown>, sensor?: Sensor): void {
    if ((!sensor && !this.canAdd) || this.saving || !this.typesState.ready || (sensor && this.sensors.isDeleting(sensor))) { return; }
    this.sensorForm = sensor ? { id: sensor.id, name: sensor.name, sensorTypeId: sensor.sensorTypeId } : { name: '', sensorTypeId: null };
    this.activeModal = this.modalService.open(content, this.modalConfig);
  }

  openType(content: TemplateRef<unknown>, type?: SensorType): void {
    if (this.saving || !this.typesState.ready || (type && this.types.isDeleting(type))) { return; }
    this.typeForm = type ? { id: type.id, name: type.name } : { name: '' };
    this.activeModal = this.modalService.open(content, this.modalConfig);
  }

  submitSensor(form: NgForm, modal: { dismiss: (reason: string) => void }): void {
    if (this.saving) { return; }
    const sensorTypeId = this.sensorForm.sensorTypeId;
    if (form.invalid || !this.sensorForm.name.trim() || sensorTypeId === null || !this.typeOptions.some((type) => type.id === sensorTypeId)) {
      form.control.markAllAsTouched();
      this.alerts.show('error', 'Error!', 'Enter a name and select an available sensor type.');
      return;
    }
    const payload = { name: this.sensorForm.name.trim(), sensorTypeId };
    const id = this.sensorForm.id;
    this.mutations.save(() => id === undefined ? this.api.createSensor(payload) : this.api.updateSensor({ id, ...payload }), () => {
      modal.dismiss('saved');
      this.alerts.show('success', 'Success!', id === undefined ? 'Sensor created successfully!' : 'Sensor updated successfully!');
      this.loadSensors();
    });
  }

  submitType(form: NgForm, modal: { dismiss: (reason: string) => void }): void {
    if (this.saving) { return; }
    if (form.invalid || !this.typeForm.name.trim()) {
      form.control.markAllAsTouched();
      this.alerts.show('error', 'Error!', 'Enter a sensor type name.');
      return;
    }
    const payload = { name: this.typeForm.name.trim() };
    const id = this.typeForm.id;
    this.mutations.save(() => id === undefined ? this.api.createType(payload) : this.api.updateType({ id, ...payload }), () => {
      modal.dismiss('saved');
      this.alerts.show('success', 'Success!', id === undefined ? 'Sensor type created successfully!' : 'Sensor type updated successfully!');
      this.loadTypes();
      this.loadSensors();
    });
  }
}
