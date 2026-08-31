import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ILayout, LayoutType } from '../../core/configs/config';
import { LayoutService } from '../../core/layout.service';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss'],
})
export class ToolbarComponent implements OnInit, OnDestroy {
  private unsubscribe: Subscription[] = [];

  // Public props
  @Input() currentLayoutType: LayoutType | null;
  @Input() appToolbarLayout:
    | 'classic'
    | 'accounting'
    | 'extended'
    | 'reports'
    | 'saas';

  // toolbar
  appToolbarDisplay: boolean;
  appToolbarContainer: 'fixed' | 'fluid';
  appToolbarContainerCSSClass: string = '';
  appToolbarFixedDesktop: boolean;
  appToolbarFixedMobile: boolean;
  appPageTitleDisplay: boolean;

  // page title
  appPageTitleDirection: string = '';
  appPageTitleCSSClass: string = '';
  appPageTitleBreadcrumb: boolean;
  appPageTitleDescription: boolean;

  constructor(private layout: LayoutService) {}

  ngOnInit(): void {
    const subscr = this.layout.layoutConfigSubject
      .asObservable()
      .subscribe((config: ILayout) => {
        this.updateProps(config);
      });
    this.unsubscribe.push(subscr);
  }

  updateProps(config: ILayout) {
    this.appToolbarDisplay = this.layout.getProp(
      'app.toolbar.display',
      config
    ) as boolean;
    if (!this.appToolbarDisplay) {
      return;
    }

    this.appPageTitleDisplay = this.layout.getProp(
      'app.pageTitle.display',
      config
    ) as boolean;
    this.appToolbarContainer = this.layout.getProp(
      'app.toolbar.container',
      config
    ) as 'fluid' | 'fixed';
    this.appToolbarContainerCSSClass =
      this.appToolbarContainer === 'fixed'
        ? 'container-xxl'
        : 'container-fluid';
    const containerClass = this.layout.getProp(
      'app.toolbar.containerClass',
      config
    ) as string;
    if (containerClass) {
      this.appToolbarContainerCSSClass += ` ${containerClass}`;
    }

    this.appToolbarFixedDesktop = this.layout.getProp(
      'app.toolbar.fixed.desktop',
      config
    ) as boolean;
    if (this.appToolbarFixedDesktop) {
      document.body.setAttribute('data-kt-app-toolbar-fixed', 'true');
    }

    this.appToolbarFixedMobile = this.layout.getProp(
      'app.toolbar.fixed.mobile',
      config
    ) as boolean;
    if (this.appToolbarFixedMobile) {
      document.body.setAttribute('data-kt-app-toolbar-fixed-mobile', 'true');
    }

    // toolbar
    this.appPageTitleDirection = this.layout.getProp(
      'app.pageTitle.direction',
      config
    ) as string;
    this.appPageTitleCSSClass = this.layout.getProp(
      'app.pageTitle.class',
      config
    ) as string;
    this.appPageTitleBreadcrumb = this.layout.getProp(
      'app.pageTitle.breadCrumb',
      config
    ) as boolean;
    this.appPageTitleDescription = this.layout.getProp(
      'app.pageTitle.description',
      config
    ) as boolean;

    // Not setting data-kt-app-toolbar-enabled: that attribute tells
    // _content.scss to zero out .app-content's own top padding, which only
    // made sense when the toolbar was a separate spacer row above the
    // content. Now the toolbar renders inside the header (see
    // header.component.html), so content should keep its normal padding.
    document.body.setAttribute('data-kt-app-header-minimize', 'on');
  }

  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }

  showPageTitle() {
    const viewsWithPageTitles = ['classic', 'reports', 'saas'];
    return (
      this.appPageTitleDisplay &&
      viewsWithPageTitles.some((t) => t === this.appToolbarLayout)
    );
  }
}
