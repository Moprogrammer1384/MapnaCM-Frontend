import { ChangeDetectorRef, Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { SwalComponent } from '@sweetalert2/ngx-sweetalert2';
import { RoleModel } from 'src/app/core/models/user-management.model';
import { SweetAlertOptions } from 'sweetalert2';
import { RolesApiService } from '../services/roles-api.service';

@Component({
  selector: 'app-role-listing',
  templateUrl: './role-listing.component.html',
  styleUrls: ['./role-listing.component.scss']
})
export class RoleListingComponent implements OnInit, OnDestroy {

  isLoading = false;

  roles: RoleModel[] = [];
  roleName = '';

  @ViewChild('formModal')
  formModal: TemplateRef<any>;

  @ViewChild('noticeSwal')
  noticeSwal!: SwalComponent;

  swalOptions: SweetAlertOptions = {};

  modalConfig: NgbModalOptions = {
    modalDialogClass: 'modal-dialog modal-dialog-centered mw-650px',
  };

  constructor(private apiService: RolesApiService, private cdr: ChangeDetectorRef, private modalService: NgbModal) { }

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.isLoading = true;
    this.apiService.getAll().subscribe({
      next: (roles) => {
        this.roles = roles;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isLoading = false;
        this.showAlert({ icon: 'error', title: 'Error!', text: error?.message || 'Unable to load roles.' });
      },
    });
  }

  openCreateModal(): void {
    this.roleName = '';
    this.modalService.open(this.formModal, this.modalConfig);
  }

  onSubmit(event: Event, myForm: NgForm) {
    if (myForm && myForm.invalid) {
      return;
    }

    this.isLoading = true;

    this.apiService.add(this.roleName).subscribe({
      next: () => {
        this.isLoading = false;
        this.modalService.dismissAll();
        this.showAlert({ icon: 'success', title: 'Success!', text: 'Role created successfully!' });
        this.loadRoles();
      },
      error: (error) => {
        this.isLoading = false;
        this.cdr.detectChanges();
        this.showAlert({ icon: 'error', title: 'Error!', text: error?.message || 'Unable to create the role. It may already exist.' });
      },
    });
  }

  showAlert(swalOptions: SweetAlertOptions) {
    let style = swalOptions.icon?.toString() || 'success';
    if (swalOptions.icon === 'error') {
      style = 'danger';
    }
    this.swalOptions = Object.assign({
      buttonsStyling: false,
      confirmButtonText: "Ok, got it!",
      customClass: {
        confirmButton: "btn btn-" + style
      }
    }, swalOptions);
    this.cdr.detectChanges();
    this.noticeSwal.fire();
  }

  ngOnDestroy(): void {
    this.modalService.dismissAll();
  }
}
