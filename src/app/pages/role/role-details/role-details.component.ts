import { Component, EventEmitter, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { catchError, Observable, of, shareReplay } from 'rxjs';
import { apiErrorMessage } from 'src/app/core/utils/api-error';
import { IRoleModel, RoleService } from 'src/app/_fake/services/role.service';
import moment from 'moment';
import { Config } from 'datatables.net';

@Component({
  selector: 'app-role-details',
  templateUrl: './role-details.component.html',
  styleUrls: ['./role-details.component.scss']
})
export class RoleDetailsComponent implements OnInit {

  role$: Observable<IRoleModel | null>;
  errorMessage = '';

  datatableConfig: Config = {};

  // Reload emitter inside datatable
  reloadEvent: EventEmitter<boolean> = new EventEmitter();

  constructor(private route: ActivatedRoute, private apiService: RoleService) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['id'];
      this.errorMessage = '';
      this.role$ = this.apiService.getRole(id).pipe(
        catchError(error => {
          this.errorMessage = apiErrorMessage(error, 'role');
          return of(null);
        }),
        shareReplay({ bufferSize: 1, refCount: true })
      );

      this.datatableConfig = {
        serverSide: true,
        ajax: (dataTablesParameters: any, callback) => {
          this.apiService.getUsers(id, dataTablesParameters).subscribe({
            next: resp => callback(resp),
            error: (error) => {
              callback({ draw: dataTablesParameters.draw, recordsTotal: 0, recordsFiltered: 0, data: [] });
              this.errorMessage = apiErrorMessage(error, 'role users');
            },
          });
        },
        columns: [
          {
            title: 'Name', data: 'name', render: function (data, type, full) {
              const colorClasses = ['success', 'info', 'warning', 'danger'];
              const randomColorClass = colorClasses[Math.floor(Math.random() * colorClasses.length)];

              const initials = data[0].toUpperCase();
              const symbolLabel = `
              <div class="symbol-label fs-3 bg-light-${randomColorClass} text-${randomColorClass}">
                ${initials}
              </div>
            `;

              const nameAndEmail = `
              <div class="d-flex flex-column" data-action="view" data-id="${full.id}">
                <a href="javascript:;" class="text-gray-800 text-hover-primary mb-1">${data}</a>
                <span>${full.email}</span>
              </div>
            `;

              return `
              <div class="symbol symbol-circle symbol-50px overflow-hidden me-3" data-action="view" data-id="${full.id}">
                <a href="javascript:;">
                  ${symbolLabel}
                </a>
              </div>
              ${nameAndEmail}
            `;
            }
          },
          {
            title: 'Role', data: 'role', render: function (data, type, row) {
              const roleName = row.roles[0]?.name;
              return roleName || '';
            },
            orderData: [1],
            orderSequence: ['asc', 'desc'],
            type: 'string',
          },
          {
            title: 'Last Login', data: 'last_login_at', render: (data, type, full) => {
              const date = data || full.created_at;
              const dateString = moment(date).fromNow();
              return `<div class="badge badge-light fw-bold">${dateString}</div>`;
            }
          },
          {
            title: 'Joined Date', data: 'created_at', render: function (data) {
              return moment(data).format('DD MMM YYYY, hh:mm a');;
            }
          }
        ],
        createdRow: function (row, data, dataIndex) {
          $('td:eq(0)', row).addClass('d-flex align-items-center');
        },
      };
    });
  }

  deleteUser(user_id: number) {
    this.route.params.subscribe(params => {
      const role_id = params['id'];
      this.apiService.deleteUser(role_id, user_id).subscribe({
        next: () => this.reloadEvent.emit(true),
        error: (error) => this.errorMessage = apiErrorMessage(error, 'data', 'API', 'Unable to remove the user from the role.'),
      });
    });
  }

}
