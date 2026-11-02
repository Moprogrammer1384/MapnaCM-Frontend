import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../../auth';
import { ProfileService } from '../../../services/profile.service';
import { ProfileDetailsComponent } from './profile-details.component';

describe('Profile error feedback', () => {
  let component: ProfileDetailsComponent;
  let api: jasmine.SpyObj<ProfileService>;
  const failure = () => throwError(() => new HttpErrorResponse({ status: 400, statusText: 'OK',
    error: { message: 'Profile update rejected.', errors: ['Email is already registered.'] } }));

  beforeEach(() => {
    api = jasmine.createSpyObj<ProfileService>('profile', ['getProfile', 'updateProfile', 'removeAvatar']);
    api.getProfile.and.returnValue(of({ id: '1', userName: 'test', email: 'test@example.test',
      phoneNumber: '123', avatarImagePath: 'avatar.png' }));
    component = new ProfileDetailsComponent(new FormBuilder(), api, {} as AuthService,
      jasmine.createSpyObj<ChangeDetectorRef>('cdr', ['detectChanges']));
  });
  afterEach(() => component.ngOnDestroy());

  it('shows server details on load failure', () => {
    api.getProfile.and.returnValue(failure());
    component.ngOnInit();
    expect(component.errorMessage).toBe('Profile update rejected. Email is already registered.');
  });

  it('shows server details on save, retains form values and clears loading', () => {
    component.ngOnInit();
    api.updateProfile.and.returnValue(failure());
    component.saveSettings();
    expect(api.updateProfile).toHaveBeenCalledTimes(1);
    expect(component.errorMessage).toBe('Profile update rejected. Email is already registered.');
    expect(component.form.value.email).toBe('test@example.test');
    expect(component.isLoading).toBeFalse();
    expect(component.successMessage).toBeUndefined();
  });

  it('shows server details on avatar removal and retains the current avatar', () => {
    component.ngOnInit();
    api.removeAvatar.and.returnValue(failure());
    component.removeAvatar();
    expect(component.errorMessage).toBe('Profile update rejected. Email is already registered.');
    expect(component.avatarPreview).toBe('avatar.png');
    expect(component.isLoading).toBeFalse();
  });
});
