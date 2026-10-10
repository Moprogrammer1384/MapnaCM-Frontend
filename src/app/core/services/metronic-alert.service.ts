import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

/** Shared Metronic presentation for success and error notifications. */
@Injectable({
  providedIn: 'root',
})
export class MetronicAlertService {
  show(icon: 'success' | 'error', title: string, text: string): void {
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
