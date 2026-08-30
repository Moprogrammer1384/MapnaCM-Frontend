import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { UserProfile } from '../../../core/models/profile.model';
import { ProfileService } from '../services/profile.service';

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
})
export class OverviewComponent implements OnInit {
  profile$: Observable<UserProfile>;

  constructor(private profileService: ProfileService) {}

  ngOnInit(): void {
    this.profile$ = this.profileService.getProfile();
  }

  fullName(profile: UserProfile): string {
    return [profile.firstName, profile.lastName]
      .filter((part) => !!part)
      .join(' ')
      .trim();
  }
}
