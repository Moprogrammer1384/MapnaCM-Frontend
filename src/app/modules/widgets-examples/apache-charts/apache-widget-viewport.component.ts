import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApacheEchartsDemo } from '../../../_metronic/partials/content/widgets/charts/Apache-Widgets/apache-echarts-demo.registry';

@Component({
  selector: 'app-apache-widget-viewport',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article #viewport class="card h-100">
      <div class="card-header border-0 pt-5">
        <div class="card-title align-items-start flex-column">
          <h2 class="card-label fw-bold fs-4 mb-1">{{ demo.title }}</h2>
          <span class="text-muted fs-7">{{ demo.id }}</span>
        </div>
        <div class="card-toolbar gap-2">
          <span *ngFor="let category of demo.categories" class="badge badge-light-primary">
            {{ category }}
          </span>
        </div>
      </div>

      <div class="card-body pt-3">
        <ng-container *ngIf="active; else placeholder">
          <ng-container *ngComponentOutlet="demo.component"></ng-container>
        </ng-container>
        <ng-template #placeholder>
          <div class="apache-widget-placeholder" aria-label="Chart waiting to load">
            <span class="spinner-border spinner-border-sm text-primary" aria-hidden="true"></span>
            <span>Chart loads when it approaches the viewport</span>
          </div>
        </ng-template>
      </div>
    </article>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 535px;
      }

      .apache-widget-placeholder {
        display: flex;
        min-height: 420px;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        color: var(--bs-gray-600);
        background: var(--bs-gray-100);
        border-radius: 0.625rem;
      }
    `,
  ],
})
export class ApacheWidgetViewportComponent implements AfterViewInit, OnDestroy {
  @Input({ required: true }) demo!: ApacheEchartsDemo;
  @ViewChild('viewport', { static: true })
  private viewport!: ElementRef<HTMLElement>;

  active = false;
  private observer?: IntersectionObserver;

  constructor(
    private readonly changeDetector: ChangeDetectorRef,
    private readonly zone: NgZone
  ) {}

  ngAfterViewInit(): void {
    if (typeof IntersectionObserver === 'undefined') {
      this.active = true;
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          this.zone.run(() => {
            this.active = true;
            this.changeDetector.markForCheck();
            this.observer?.disconnect();
            this.observer = undefined;
          });
        }
      },
      { rootMargin: '700px 0px' }
    );
    this.observer.observe(this.viewport.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
