import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { UserProfile } from 'src/app/core/models/profile.model';
import { ProfileService } from '../services/profile.service';
import { OverviewComponent } from './overview.component';

describe('Profile overview error feedback', () => {
  it('renders the actual server message as a Metronic alert', () => {
    const response = new Subject<UserProfile>();
    TestBed.configureTestingModule({ imports: [CommonModule], declarations: [OverviewComponent],
      providers: [provideRouter([]), { provide: ProfileService, useValue: { getProfile: () => response } }] });
    const fixture = TestBed.createComponent(OverviewComponent);
    fixture.detectChanges();
    response.error(new HttpErrorResponse({ status: 400, statusText: 'OK', error: { message: 'Profile is unavailable.' } }));
    fixture.detectChanges();
    const alert = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;
    expect(alert.classList.contains('alert-danger')).toBeTrue();
    expect(alert.textContent?.trim()).toBe('Profile is unavailable.');
  });
});
