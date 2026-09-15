import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import moment from 'moment';
import { AdminUserDetail, USER_AUDIT_ACTION_LABELS } from 'src/app/core/models/user-management.model';
import { UserManagementService } from '../services/user-management.service';

@Component({
  selector: 'app-user-details',
  templateUrl: './user-details.component.html',
  styleUrls: ['./user-details.component.scss']
})
export class UserDetailsComponent implements OnInit {

  user: AdminUserDetail | null = null;
  isLoading = true;
  errorMessage = '';

  constructor(
    private userService: UserManagementService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage = 'User id is missing.';
      this.isLoading = false;
      return;
    }

    this.userService.getUserById(id).subscribe({
      next: (user) => {
        this.user = user;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error?.message || 'Unable to load the user.';
        this.isLoading = false;
      },
    });
  }

  get fullName(): string {
    const user = this.user;
    if (!user) {
      return '';
    }
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.userName;
  }

  get initials(): string {
    const user = this.user;
    if (!user) {
      return '?';
    }
    const first = user.firstName?.[0] || user.userName?.[0] || '?';
    const last = user.lastName?.[0] || '';
    return `${first}${last}`.toUpperCase();
  }

  get roleNames(): string[] {
    return (this.user?.roles || []).map(role => role.name);
  }

  actionLabel(action: number): string {
    return USER_AUDIT_ACTION_LABELS[action] || 'Change';
  }

  actionBadgeClass(action: number): string {
    switch (action) {
      case 1: return 'badge-light-primary';
      case 4: return 'badge-light-success';
      case 5:
      case 7: return 'badge-light-danger';
      default: return 'badge-light-info';
    }
  }

  formatDate(value?: string | null): string {
    return value ? moment(value).format('DD MMM YYYY, hh:mm a') : '—';
  }

  fromNow(value?: string | null): string {
    return value ? moment(value).fromNow() : '';
  }

  goBack(): void {
    this.router.navigate(['/apps/users']);
  }
}
