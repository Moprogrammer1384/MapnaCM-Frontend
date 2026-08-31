import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationCancel, NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { LayoutService } from '../../core/layout.service';
import { MenuComponent } from '../../../kt/components';
import { ILayout } from '../../core/configs/config';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  private unsubscribe: Subscription[] = [];
  // Public props
  appHeaderDisplay: boolean;
  appHeaderDefaultFixedDesktop: boolean;
  appHeaderDefaultFixedMobile: boolean;

  appHeaderDefaultContainer: 'fixed' | 'fluid';
  headerContainerCssClass: string = '';
  appHeaderDefaultContainerClass: string = '';

  appHeaderDefaultStacked: boolean;

  // view
  appSidebarDefaultCollapseDesktopEnabled: boolean;
  appSidebarDisplay: boolean;

  // toolbar (rendered in the header wrapper, in place of the removed header-menu)
  appToolbarDisplay: boolean;
  appToolbarLayout: 'classic' | 'accounting' | 'extended' | 'reports' | 'saas';
  appToolbarCSSClass: string = '';
  appToolbarSwapEnabled: boolean;
  appToolbarSwapAttributes: { [attrName: string]: string } = {};
  appToolbarStickyEnabled: boolean;
  appToolbarStickyAttributes: { [attrName: string]: string } = {};
  appToolbarMinimizeEnabled: boolean;
  appToolbarMinimizeAttributes: { [attrName: string]: string } = {};

  constructor(private layout: LayoutService, private router: Router) {
    this.routingChanges();
  }

  updateProps(config: ILayout) {
    this.appHeaderDisplay = this.layout.getProp(
      'app.header.display',
      config
    ) as boolean;
    // view
    this.appSidebarDefaultCollapseDesktopEnabled = this.layout.getProp(
      'app.sidebar.default.collapse.desktop.enabled',
      config
    ) as boolean;
    this.appSidebarDisplay = this.layout.getProp(
      'app.sidebar.display',
      config
    ) as boolean;

    // body attrs and container css classes
    this.appHeaderDefaultFixedDesktop = this.layout.getProp(
      'app.header.default.fixed.desktop',
      config
    ) as boolean;
    if (this.appHeaderDefaultFixedDesktop) {
      document.body.setAttribute('data-kt-app-header-fixed', 'true');
    }

    this.appHeaderDefaultFixedMobile = this.layout.getProp(
      'app.header.default.fixed.mobile',
      config
    ) as boolean;
    if (this.appHeaderDefaultFixedMobile) {
      document.body.setAttribute('data-kt-app-header-fixed-mobile', 'true');
    }

    this.appHeaderDefaultContainer = this.layout.getProp(
      'appHeaderDefaultContainer',
      config
    ) as 'fixed' | 'fluid';
    this.headerContainerCssClass =
      this.appHeaderDefaultContainer === 'fixed'
        ? 'container-xxl'
        : 'container-fluid';

    this.appHeaderDefaultContainerClass = this.layout.getProp(
      'app.header.default.containerClass',
      config
    ) as string;
    if (this.appHeaderDefaultContainerClass) {
      this.headerContainerCssClass += ` ${this.appHeaderDefaultContainerClass}`;
    }

    this.appHeaderDefaultStacked = this.layout.getProp(
      'app.header.default.stacked',
      config
    ) as boolean;
    if (this.appHeaderDefaultStacked) {
      document.body.setAttribute('data-kt-app-header-stacked', 'true');
    }

    // Primary header
    // Secondary header

    // toolbar
    this.appToolbarDisplay = this.layout.getProp(
      'app.toolbar.display',
      config
    ) as boolean;
    if (this.appToolbarDisplay) {
      this.updateToolbar(config);
    }
  }

  updateToolbar(config: ILayout) {
    this.appToolbarLayout = this.layout.getProp(
      'app.toolbar.layout',
      config
    ) as 'classic' | 'accounting' | 'extended' | 'reports' | 'saas';
    this.appToolbarSwapEnabled = this.layout.getProp(
      'app.toolbar.swap.enabled',
      config
    ) as boolean;
    if (this.appToolbarSwapEnabled) {
      this.appToolbarSwapAttributes = this.layout.getProp(
        'app.toolbar.swap.attributes',
        config
      ) as { [attrName: string]: string };
    }

    this.appToolbarStickyEnabled = this.layout.getProp(
      'app.toolbar.sticky.enabled',
      config
    ) as boolean;
    if (this.appToolbarStickyEnabled) {
      this.appToolbarStickyAttributes = this.layout.getProp(
        'app.toolbar.sticky.attributes',
        config
      ) as { [attrName: string]: string };
    }

    this.appToolbarCSSClass =
      (this.layout.getProp('app.toolbar.class', config) as string) || '';
    this.appToolbarMinimizeEnabled = this.layout.getProp(
      'app.toolbar.minimize.enabled',
      config
    ) as boolean;
    if (this.appToolbarMinimizeEnabled) {
      this.appToolbarMinimizeAttributes = this.layout.getProp(
        'app.toolbar.minimize.attributes',
        config
      ) as { [attrName: string]: string };
      this.appToolbarCSSClass += ' app-toolbar-minimize';
    }

    setTimeout(() => {
      const toolbarElement = document.getElementById('kt_app_toolbar');
      // toolbar
      if (this.appToolbarDisplay && toolbarElement) {
        const toolbarAttributes = toolbarElement
          .getAttributeNames()
          .filter((t) => t.indexOf('data-') > -1);
        toolbarAttributes.forEach((attr) =>
          toolbarElement.removeAttribute(attr)
        );

        if (this.appToolbarSwapEnabled) {
          for (const key in this.appToolbarSwapAttributes) {
            if (this.appToolbarSwapAttributes.hasOwnProperty(key)) {
              toolbarElement.setAttribute(
                key,
                this.appToolbarSwapAttributes[key]
              );
            }
          }
        }

        if (this.appToolbarStickyEnabled) {
          for (const key in this.appToolbarStickyAttributes) {
            if (this.appToolbarStickyAttributes.hasOwnProperty(key)) {
              toolbarElement.setAttribute(
                key,
                this.appToolbarStickyAttributes[key]
              );
            }
          }
        }

        if (this.appToolbarMinimizeEnabled) {
          for (const key in this.appToolbarMinimizeAttributes) {
            if (this.appToolbarMinimizeAttributes.hasOwnProperty(key)) {
              toolbarElement.setAttribute(
                key,
                this.appToolbarMinimizeAttributes[key]
              );
            }
          }
        }
      }
    }, 0);
  }

  ngOnInit(): void {
    const subscr = this.layout.layoutConfigSubject
      .asObservable()
      .subscribe((config: ILayout) => {
        this.updateProps(config);
      });
    this.unsubscribe.push(subscr);
  }

  routingChanges() {
    const routerSubscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd || event instanceof NavigationCancel) {
        MenuComponent.reinitialization();
      }
    });
    this.unsubscribe.push(routerSubscription);
  }

  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }
}
