import { CommonModule } from '@angular/common';
import { Component, ContentChild, ElementRef, EventEmitter, Input, OnDestroy, Output, TemplateRef } from '@angular/core';
import { TabsModule } from 'primeng/tabs';
import { SharedModule } from 'src/app/_metronic/shared/shared.module';

export interface ClosableTab {
  readonly id: string;
  readonly title: string;
}

/** PrimeNG owns tab selection/keyboard behavior; the caller owns each tab's state. */
@Component({
  selector: 'app-closable-tabs',
  standalone: true,
  imports: [CommonModule, TabsModule, SharedModule],
  templateUrl: './closable-tabs.component.html',
  host: { class: 'd-block mw-100 darp-closable-tabs' },
})
export class ClosableTabsComponent implements OnDestroy {
  @Input({ required: true }) tabs: readonly ClosableTab[] = [];
  @Input() activeId = '';
  @Output() readonly activeIdChange = new EventEmitter<string>();
  @Output() readonly tabClose = new EventEmitter<string>();
  @ContentChild(TemplateRef) content?: TemplateRef<{ $implicit: string }>;
  private focusTimer?: ReturnType<typeof setTimeout>;

  constructor(private element: ElementRef<HTMLElement>) {}

  select(value: string | number): void {
    this.activeIdChange.emit(String(value));
  }

  close(event: Event, id: string): void {
    event.stopPropagation();
    this.tabClose.emit(id);
    clearTimeout(this.focusTimer);
    this.focusTimer = setTimeout(() => {
      this.element.nativeElement.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')?.focus();
    });
  }

  ngOnDestroy(): void { clearTimeout(this.focusTimer); }
}
