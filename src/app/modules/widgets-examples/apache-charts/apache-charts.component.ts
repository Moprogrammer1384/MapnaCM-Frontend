import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  APACHE_ECHARTS_DEMOS,
  ApacheEchartsDemo,
} from '../../../_metronic/partials/content/widgets/charts/Apache-Widgets/apache-echarts-demo.registry';
import { ApacheWidgetViewportComponent } from './apache-widget-viewport.component';

@Component({
  selector: 'app-apache-charts',
  standalone: true,
  imports: [CommonModule, FormsModule, ApacheWidgetViewportComponent],
  templateUrl: './apache-charts.component.html',
  styleUrls: ['./apache-charts.component.scss'],
})
export class ApacheChartsComponent {
  readonly demos = APACHE_ECHARTS_DEMOS;
  readonly categories = Array.from(
    new Set(
      this.demos.reduce<string[]>((categories, demo) => {
        categories.push(...demo.categories);
        return categories;
      }, [])
    )
  ).sort((left, right) => left.localeCompare(right));

  searchTerm = '';
  selectedCategory = '';

  get visibleDemos(): readonly ApacheEchartsDemo[] {
    const query = this.searchTerm.trim().toLocaleLowerCase();
    return this.demos.filter((demo) => {
      const matchesCategory =
        !this.selectedCategory || demo.categories.includes(this.selectedCategory);
      if (!matchesCategory) {
        return false;
      }
      if (!query) {
        return true;
      }
      const searchable = [
        demo.id,
        demo.title,
        demo.titleCN,
        ...demo.categories,
      ]
        .join(' ')
        .toLocaleLowerCase();
      return searchable.includes(query);
    });
  }

  trackByDemoId(_index: number, demo: ApacheEchartsDemo): string {
    return demo.id;
  }
}
