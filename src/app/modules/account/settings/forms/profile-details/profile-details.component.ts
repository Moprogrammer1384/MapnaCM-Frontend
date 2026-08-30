import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, Subscription } from 'rxjs';
import { finalize, first } from 'rxjs/operators';
import { AuthService } from '../../../../auth';
import { ProfileService } from '../../../services/profile.service';

@Component({
  selector: 'app-profile-details',
  templateUrl: './profile-details.component.html',
})
export class ProfileDetailsComponent implements OnInit, OnDestroy {
  isLoading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  isLoading: boolean;
  form: FormGroup;
  avatarPreview: string = './assets/media/avatars/blank.png';
  errorMessage: string | undefined;
  successMessage: string | undefined;
  avatarError: string | undefined;
  @ViewChild('avatarInput') avatarInput: ElementRef<HTMLInputElement>;

  private readonly maxAvatarSizeBytes = 2 * 1024 * 1024;
  private readonly allowedAvatarTypes = ['image/jpeg', 'image/png', 'image/webp'];
  avatarFile: File | null = null;
  private currentAvatar = './assets/media/avatars/blank.png';
  private unsubscribe: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    const loadingSubscr = this.isLoading$
      .asObservable()
      .subscribe((res) => (this.isLoading = res));
    this.unsubscribe.push(loadingSubscr);
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      firstName: ['', Validators.required],
      lastName: [''],
      email: ['', Validators.email],
      phoneNumber: [''],
      address: [''],
    });
    this.loadProfile();
  }

  onAvatarChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file) {
      return;
    }
    // mirror the backend rules so invalid picks are rejected before upload
    if (
      this.allowedAvatarTypes.indexOf(file.type) === -1 ||
      file.size > this.maxAvatarSizeBytes
    ) {
      this.avatarFile = null;
      this.avatarError =
        'Invalid image. Allowed formats: JPG, JPEG, PNG, WEBP with a maximum size of 2 MB.';
      this.cdr.detectChanges();
      return;
    }
    this.avatarError = undefined;
    this.avatarFile = file;
    const reader = new FileReader();
    reader.onload = () => {
      this.avatarPreview = reader.result as string;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  cancelAvatar() {
    this.avatarFile = null;
    this.avatarError = undefined;
    this.avatarPreview = this.currentAvatar;
    // reset the input so picking the same file again fires (change)
    if (this.avatarInput) {
      this.avatarInput.nativeElement.value = '';
    }
  }

  saveSettings() {
    this.errorMessage = undefined;
    this.successMessage = undefined;
    this.avatarError = undefined;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading$.next(true);
    const data = new FormData();
    data.append('FirstName', this.form.value.firstName || '');
    data.append('LastName', this.form.value.lastName || '');
    data.append('Email', this.form.value.email || '');
    data.append('PhoneNumber', this.form.value.phoneNumber || '');
    data.append('Address', this.form.value.address || '');
    if (this.avatarFile) {
      data.append('Avatar', this.avatarFile, this.avatarFile.name);
    }

    const subscr = this.profileService
      .updateProfile(data)
      .pipe(
        first(),
        finalize(() => {
          this.isLoading$.next(false);
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (profile) => {
          this.currentAvatar = profile.avatarImagePath || this.currentAvatar;
          this.avatarPreview = this.currentAvatar;
          this.avatarFile = null;
          this.successMessage = 'Profile updated successfully.';
          // refresh the shared current user so the header/avatar update everywhere
          this.authService.getUserByToken().subscribe();
        },
        error: (err) => {
          this.errorMessage = err?.message || 'Unable to update the profile.';
        },
      });
    this.unsubscribe.push(subscr);
  }

  private loadProfile() {
    const subscr = this.profileService
      .getProfile()
      .pipe(first())
      .subscribe({
        next: (profile) => {
          this.form.patchValue({
            firstName: profile.firstName || '',
            lastName: profile.lastName || '',
            email: profile.email || '',
            phoneNumber: profile.phoneNumber || '',
            address: profile.address || '',
          });
          this.currentAvatar =
            profile.avatarImagePath || './assets/media/avatars/blank.png';
          this.avatarPreview = this.currentAvatar;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.errorMessage = err?.message || 'Unable to load the profile.';
          this.cdr.detectChanges();
        },
      });
    this.unsubscribe.push(subscr);
  }

  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }
}
