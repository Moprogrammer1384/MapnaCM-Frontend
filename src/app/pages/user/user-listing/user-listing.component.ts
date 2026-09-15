import { AfterViewInit, ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, Renderer2, TemplateRef, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { SwalComponent } from '@sweetalert2/ngx-sweetalert2';
import { Config } from 'datatables.net';
import moment from 'moment';
import Swal from 'sweetalert2';
import { SweetAlertOptions } from 'sweetalert2';
import { RoleModel } from 'src/app/core/models/user-management.model';
import { RolesApiService } from '../../role/services/roles-api.service';
import { AdminUserDetail, CreateUserPayload, EditUserPayload } from '../../../core/models/user-management.model';
import { DataTablesResponse, UserManagementService } from '../services/user-management.service';

interface UserFormModel {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  roles: string[];
}

@Component({
  selector: 'app-user-listing',
  templateUrl: './user-listing.component.html',
  styleUrls: ['./user-listing.component.scss']
})
export class UserListingComponent implements OnInit, AfterViewInit, OnDestroy {

  isCollapsed1 = false;

  isLoading = false;

  datatableConfig: Config = {};

  // Reload emitter inside datatable
  reloadEvent: EventEmitter<boolean> = new EventEmitter();

  // Single model backing the add/edit modal
  userModel: UserFormModel = this.emptyUserModel();

  roles: RoleModel[] = [];

  @ViewChild('noticeSwal')
  noticeSwal!: SwalComponent;

  swalOptions: SweetAlertOptions = {};

  private clickListener: () => void;

  constructor(
    private apiService: UserManagementService,
    private rolesApiService: RolesApiService,
    private cdr: ChangeDetectorRef,
    private renderer: Renderer2
  ) { }

  ngOnInit(): void {
    this.rolesApiService.getAll().subscribe((roles) => {
      this.roles = roles;
      this.cdr.detectChanges();
    });

    this.datatableConfig = {
      serverSide: true,
      ajax: (dataTablesParameters: any, callback) => {
        this.apiService.getUsers(dataTablesParameters).subscribe(resp => {
          callback(resp);
        });
      },
      columns: [
        {
          title: 'User', data: 'userName', render: (data, type, full) => {
            const name = `${full.firstName || ''} ${full.lastName || ''}`.trim() || full.userName;
            const initials = (full.firstName?.[0] || full.userName?.[0] || '?').toUpperCase();
            const email = full.email || '';

            return `
              <div class="d-flex align-items-center">
                <div class="symbol symbol-circle symbol-50px overflow-hidden me-3" data-action="view" data-id="${full.id}">
                  <a href="javascript:;">
                    <span class="symbol-label fs-3 bg-light-primary text-primary">${initials}</span>
                  </a>
                </div>
                <div class="d-flex flex-column" data-action="view" data-id="${full.id}">
                  <a href="javascript:;" class="text-gray-800 text-hover-primary mb-1">${name}</a>
                  <span>${email}</span>
                </div>
              </div>
            `;
          }
        },
        {
          title: 'Roles', data: 'roles', orderable: false, render: (data: string[]) => {
            const badges = (data || [])
              .map(role => `<span class="badge badge-light-primary fw-bold me-1">${role}</span>`)
              .join('');
            return badges || '<span class="text-muted fs-7">—</span>';
          }
        },
        {
          title: 'Status', data: 'isActive', render: (data: boolean, type, full) => {
            // Clicks are confirmed in the component before the API call.
            return `
              <label class="form-check form-switch form-switch-sm form-check-custom form-check-solid" data-action="toggle-active" data-id="${full.id}" data-active="${data}" title="${data ? 'Deactivate' : 'Activate'}">
                <input class="form-check-input" type="checkbox" ${data ? 'checked' : ''} />
              </label>
            `;
          }
        },
        {
          title: 'Created', data: 'createdAtUtc', render: (data) => {
            if (!data) {
              return '<span class="text-muted fs-7">—</span>';
            }
            return `
              <div class="d-flex flex-column">
                <span class="text-gray-800 fw-semibold">${moment(data).format('DD MMM YYYY')}</span>
                <span class="text-muted fs-7">${moment(data).format('hh:mm a')}</span>
              </div>
            `;
          }
        }
      ],
      createdRow: function (row, data, dataIndex) {
        $('td:eq(0)', row).addClass('min-w-250px');
      },
    };
  }

  ngAfterViewInit(): void {
    // The status switches are rendered by DataTables, so listen at document
    // level (same delegation approach as <app-crud>).
    this.clickListener = this.renderer.listen(document, 'click', (event) => {
      const toggle = (event.target as HTMLElement).closest('[data-action="toggle-active"]') as HTMLElement | null;
      if (!toggle) {
        return;
      }

      event.preventDefault();

      const id = toggle.dataset['id'];
      const willActivate = toggle.dataset['active'] !== 'true';
      if (!id) {
        return;
      }

      Swal.fire({
        icon: 'warning',
        title: willActivate ? 'Activate user?' : 'Deactivate user?',
        text: willActivate
          ? 'The user will be able to sign in again.'
          : 'The user will be signed out and unable to sign in until reactivated.',
        showCancelButton: true,
        buttonsStyling: false,
        confirmButtonText: `Yes, ${willActivate ? 'activate' : 'deactivate'}!`,
        cancelButtonText: 'Cancel',
        customClass: {
          confirmButton: 'btn btn-primary',
          cancelButton: 'btn btn-light',
        },
      }).then((result) => {
        if (!result.isConfirmed) {
          this.reloadEvent.emit(true);
          return;
        }

        this.apiService.setActive(id, willActivate).subscribe({
          next: () => {
            this.showAlert({
              icon: 'success',
              title: 'Success!',
              text: `User ${willActivate ? 'activated' : 'deactivated'} successfully!`,
            });
            this.reloadEvent.emit(true);
          },
          error: (error) => {
            this.showAlert({ icon: 'error', title: 'Error!', text: this.errorMessage(error) });
            this.reloadEvent.emit(true);
          },
        });
      });
    });
  }

  delete(id: string) {
    this.apiService.deleteUser(id).subscribe({
      next: () => this.reloadEvent.emit(true),
      error: (error) => {
        this.showAlert({ icon: 'error', title: 'Error!', text: this.errorMessage(error) });
        this.reloadEvent.emit(true);
      },
    });
  }

  edit(id: string) {
    this.apiService.getUserById(id).subscribe((user: AdminUserDetail) => {
      this.userModel = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber || '',
        password: '',
        roles: (user.roles || []).map(role => role.name),
      };
      this.cdr.detectChanges();
    });
  }

  create() {
    this.userModel = this.emptyUserModel();
  }

  onRoleToggle(roleName: string, event: any) {
    const checked = event.target?.checked;
    if (checked) {
      if (!this.userModel.roles.includes(roleName)) {
        this.userModel.roles = [...this.userModel.roles, roleName];
      }
    } else {
      this.userModel.roles = this.userModel.roles.filter(role => role !== roleName);
    }
  }

  onSubmit(event: Event, myForm: NgForm) {
    if (myForm && myForm.invalid) {
      return;
    }

    if (this.userModel.roles.length === 0) {
      this.showAlert({ icon: 'error', title: 'Error!', text: 'Please assign at least one role.' });
      return;
    }

    this.isLoading = true;

    const isEdit = !!this.userModel.id;
    const successAlert: SweetAlertOptions = {
      icon: 'success',
      title: 'Success!',
      text: isEdit ? 'User updated successfully!' : 'User created successfully!',
    };
    const errorAlert: SweetAlertOptions = {
      icon: 'error',
      title: 'Error!',
      text: '',
    };

    const request$ = isEdit
      ? this.apiService.editUser({
          userId: this.userModel.id!,
          firstName: this.userModel.firstName,
          lastName: this.userModel.lastName,
          email: this.userModel.email,
          phoneNumber: this.userModel.phoneNumber,
          roles: this.userModel.roles,
        } as EditUserPayload)
      : this.apiService.createUser({
          firstName: this.userModel.firstName,
          lastName: this.userModel.lastName,
          email: this.userModel.email,
          userName: this.userModel.email,
          phoneNumber: this.userModel.phoneNumber,
          password: this.userModel.password,
          roles: this.userModel.roles,
        } as CreateUserPayload);

    request$.subscribe({
      next: () => {
        this.isLoading = false;
        this.showAlert(successAlert);
        this.reloadEvent.emit(true);
      },
      error: (error) => {
        this.isLoading = false;
        this.cdr.detectChanges();
        errorAlert.text = this.errorMessage(error);
        this.showAlert(errorAlert);
      },
    });
  }

  private emptyUserModel(): UserFormModel {
    return { firstName: '', lastName: '', email: '', phoneNumber: '', password: '', roles: [] };
  }

  private errorMessage(error: any): string {
    return error?.message || this.extractText(error?.error) || 'An unexpected error occurred.';
  }

  extractText(obj: any): string {
    var textArray: string[] = [];

    for (var key in obj) {
      if (typeof obj[key] === 'string') {
        // If the value is a string, add it to the 'textArray'
        textArray.push(obj[key]);
      } else if (typeof obj[key] === 'object') {
        // If the value is an object, recursively call the function and concatenate the results
        textArray = textArray.concat(this.extractText(obj[key]));
      }
    }

    // Use a Set to remove duplicates and convert back to an array
    var uniqueTextArray = Array.from(new Set(textArray));

    // Convert back to a single string with line breaks
    var text = uniqueTextArray.join('\n');

    return text;
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
    if (this.clickListener) {
      this.clickListener();
    }
  }
}
