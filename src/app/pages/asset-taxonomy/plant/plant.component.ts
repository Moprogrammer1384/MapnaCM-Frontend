import { ChangeDetectorRef, Component, OnInit, TemplateRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { AssetApiService } from '../services/asset-api.service';
import { ClientTable } from '../client-table';

interface PlantRow extends Record<string, string> {
  id: string;
  name: string;
  type: string;
  site: string;
  plantTypeId: string;
  siteId: string;
}

interface TypeRow extends Record<string, string> {
  id: string;
  name: string;
}

interface PlantFormModel {
  id?: number;
  name: string;
  plantTypeId: number | null;
  siteId: number | null;
}

interface TypeFormModel {
  id?: number;
  name: string;
}

@Component({
  selector: 'app-plant',
  templateUrl: './plant.component.html',
  styleUrls: ['./plant.component.scss'],
})
export class PlantComponent implements OnInit {
  modalConfig: NgbModalOptions = {
    modalDialogClass: 'modal-dialog modal-dialog-centered mw-650px',
  };

  plants = new ClientTable<PlantRow>(
    [],
    [
      { key: 'name', title: 'Name', class: 'min-w-250px' },
      { key: 'type', title: 'Type', class: 'min-w-150px' },
      { key: 'site', title: 'Site', class: 'min-w-150px' },
    ]
  );

  types = new ClientTable<TypeRow>(
    [],
    [{ key: 'name', title: 'Name', class: 'min-w-150px' }]
  );

  // Options for the Type / Site selects in the plant modals, loaded from the
  // backend (sites keep the "City (lat, lng)" display label).
  typeOptions: { id: number; name: string }[] = [];
  siteOptions: { id: number; label: string }[] = [];

  plantFormModel: PlantFormModel = this.emptyPlantForm();
  typeFormModel: TypeFormModel = this.emptyTypeForm();
  saving = false;

  constructor(
    private modalService: NgbModal,
    private apiService: AssetApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.plants.onConfirmedDelete = (row) => this.deletePlant(row);
    this.types.onConfirmedDelete = (row) => this.deleteType(row);
    this.loadAll();
  }

  loadAll(): void {
    this.loadSites();
    this.loadTypes();
    this.loadPlants();
  }

  loadSites(): void {
    this.apiService.getAllSites().subscribe({
      next: (sites) => {
        this.siteOptions = sites.map((site) => ({
          id: site.id,
          label: `${site.city} (${site.latitude}, ${site.longitude})`,
        }));
        this.cdr.detectChanges();
      },
      error: (error) => this.showAlert('error', 'Error!', error?.message || 'Unable to load sites.'),
    });
  }

  loadTypes(): void {
    this.apiService.getAllPlantTypes().subscribe({
      next: (types) => {
        this.typeOptions = types.map((type) => ({ id: type.id, name: type.name }));
        this.types.rows = types.map((type) => ({ id: String(type.id), name: type.name }));
        this.types.page = 1;
        this.cdr.detectChanges();
      },
      error: (error) => this.showAlert('error', 'Error!', error?.message || 'Unable to load plant types.'),
    });
  }

  loadPlants(): void {
    this.apiService.getAllPlants().subscribe({
      next: (plants) => {
        this.plants.rows = plants.map((plant) => ({
          id: String(plant.id),
          name: plant.name,
          type: plant.typeName,
          site: plant.siteLabel,
          plantTypeId: String(plant.plantTypeId),
          siteId: String(plant.siteId),
        }));
        this.plants.page = 1;
        this.cdr.detectChanges();
      },
      error: (error) => this.showAlert('error', 'Error!', error?.message || 'Unable to load plants.'),
    });
  }

  // ---- Plant modal ----------------------------------------------------

  openAddPlantModal(content: TemplateRef<any>): void {
    this.plantFormModel = this.emptyPlantForm();
    this.modalService.open(content, this.modalConfig);
  }

  openEditPlantModal(content: TemplateRef<any>, plant: PlantRow): void {
    this.plantFormModel = {
      id: Number(plant.id),
      name: plant.name,
      plantTypeId: Number(plant.plantTypeId),
      siteId: Number(plant.siteId),
    };
    this.modalService.open(content, this.modalConfig);
  }

  submitPlant(form: NgForm, modal: { dismiss: (reason: string) => void }): void {
    if (this.saving) {
      return;
    }
    if (form.invalid || !this.plantFormModel.plantTypeId || !this.plantFormModel.siteId) {
      form.control.markAllAsTouched();
      this.showAlert('error', 'Error!', 'Please fill in all required fields.');
      return;
    }

    this.saving = true;
    const payload = {
      name: this.plantFormModel.name,
      siteId: this.plantFormModel.siteId,
      plantTypeId: this.plantFormModel.plantTypeId,
    };
    const isEdit = !!this.plantFormModel.id;
    const request$ = isEdit
      ? this.apiService.updatePlant({ id: this.plantFormModel.id!, ...payload })
      : this.apiService.createPlant(payload);

    request$.subscribe({
      next: () => {
        this.saving = false;
        modal.dismiss('saved');
        this.showAlert('success', 'Success!', isEdit ? 'Plant updated successfully!' : 'Plant created successfully!');
        this.loadPlants();
      },
      error: (error) => {
        this.saving = false;
        this.cdr.detectChanges();
        this.showAlert('error', 'Error!', error?.message || 'The request failed.');
      },
    });
  }

  deletePlant(plant: PlantRow): void {
    this.apiService.deletePlant(Number(plant.id)).subscribe({
      next: () => {
        this.showAlert('success', 'Deleted!', 'You have deleted ' + plant.name + '!.');
        this.loadPlants();
      },
      error: (error) => this.showAlert('error', 'Error!', error?.message || 'Unable to delete the plant.'),
    });
  }

  // ---- Type modal -------------------------------------------------------

  openAddTypeModal(content: TemplateRef<any>): void {
    this.typeFormModel = this.emptyTypeForm();
    this.modalService.open(content, this.modalConfig);
  }

  openEditTypeModal(content: TemplateRef<any>, type: TypeRow): void {
    this.typeFormModel = { id: Number(type.id), name: type.name };
    this.modalService.open(content, this.modalConfig);
  }

  submitType(form: NgForm, modal: { dismiss: (reason: string) => void }): void {
    if (this.saving) {
      return;
    }
    if (form.invalid) {
      form.control.markAllAsTouched();
      this.showAlert('error', 'Error!', 'Please fill in all required fields.');
      return;
    }

    this.saving = true;
    const isEdit = !!this.typeFormModel.id;
    const request$ = isEdit
      ? this.apiService.updatePlantType({ id: this.typeFormModel.id!, name: this.typeFormModel.name })
      : this.apiService.createPlantType(this.typeFormModel.name);

    request$.subscribe({
      next: () => {
        this.saving = false;
        modal.dismiss('saved');
        this.showAlert('success', 'Success!', isEdit ? 'Type updated successfully!' : 'Type created successfully!');
        this.loadTypes();
      },
      error: (error) => {
        this.saving = false;
        this.cdr.detectChanges();
        this.showAlert('error', 'Error!', error?.message || 'The request failed.');
      },
    });
  }

  deleteType(type: TypeRow): void {
    this.apiService.deletePlantType(Number(type.id)).subscribe({
      next: () => {
        this.showAlert('success', 'Deleted!', 'You have deleted ' + type.name + '!.');
        this.loadTypes();
      },
      error: (error) => this.showAlert('error', 'Error!', error?.message || 'Unable to delete the type.'),
    });
  }

  // ---- Helpers --------------------------------------------------------

  private emptyPlantForm(): PlantFormModel {
    return { name: '', plantTypeId: null, siteId: null };
  }

  private emptyTypeForm(): TypeFormModel {
    return { name: '' };
  }

  private showAlert(icon: 'success' | 'error', title: string, text: string): void {
    Swal.fire({
      icon,
      title,
      text,
      buttonsStyling: false,
      confirmButtonText: 'Ok, got it!',
      customClass: {
        confirmButton: 'btn fw-bold btn-' + (icon === 'error' ? 'danger' : 'primary'),
      },
    });
  }
}
