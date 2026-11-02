import { Component, OnInit } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';
import { apiErrorMessage } from 'src/app/core/utils/api-error';
import { UserProfile } from '../../../core/models/profile.model';
import { ProfileService } from '../services/profile.service';

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
})
export class OverviewComponent implements OnInit {
  profile$: Observable<UserProfile | null>;
  errorMessage = '';

  constructor(private profileService: ProfileService) {}

  ngOnInit(): void {
    this.profile$ = this.profileService.getProfile().pipe(catchError(error => {
      this.errorMessage = apiErrorMessage(error, 'profile');
      return of(null);
    }));
  }

  fullName(profile: UserProfile): string {
    return [profile.firstName, profile.lastName]
      .filter((part) => !!part)
      .join(' ')
      .trim();
  }
}
