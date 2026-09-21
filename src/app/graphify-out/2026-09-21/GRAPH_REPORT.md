# Graph Report - app  (2026-09-15)

## Corpus Check
- 322 files · ~101,478 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1934 nodes · 3474 edges · 151 communities (107 shown, 44 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 67 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c308e1c8`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- MenuComponent
- ScrollComponent
- FeedbackComponent
- widgets.module.ts
- ChatInnerComponent
- PermissionListingComponent
- chat.module.ts
- partials/index.ts
- DrawerComponent
- StepperComponent
- profile.module.ts
- widgets-examples.module.ts
- UserModel
- PageInfoService
- _utils/index.ts
- drawers.module.ts
- routing.ts
- cards.module.ts
- ILayout
- LayoutService
- dropdown-menus.module.ts
- PasswordMeterComponent
- auth.module.ts
- auth.service.ts
- FooterComponent
- config.ts
- LayoutType
- engages.module.ts
- components/index.ts
- _ScrollTopComponent.ts
- AuthService
- ElementAnimateUtil
- app.component.ts
- account.module.ts
- auth-http.service.ts
- modals.module.ts
- SplashScreenService
- CrudComponent
- RoleListingComponent
- StickyComponent
- user-management.model.ts
- UserDetailsComponent
- UserListingComponent
- UserManagementService
- charts-widget5.component.ts
- NewChartsWidget8Component
- topbar.component.ts
- notifications-inner.component.ts
- layout.module.ts
- wizards.module.ts
- ThemeMode
- SwapperStore
- SearchResultInnerComponent
- RegistrationComponent
- SwapperComponent
- ToolbarComponent
- layout.service.ts
- SignInMethodComponent
- EventHandlerUtil
- LoginComponent
- SidebarMenuComponent
- KeeniconComponent
- wizards-routing.module.ts
- ContentComponent
- sidebar.component.ts
- SidebarLogoComponent
- ClassicComponent
- MixedWidget8Component
- MixedWidget9Component
- CardsWidget17Component
- StatsWidget3Component
- StatsWidget4Component
- TablesWidget5Component
- TablesWidget6Component
- TablesWidget7Component
- TablesWidget8Component
- ProfileDetailsComponent
- charts-widget6.component.ts
- AuthHTTPService
- HorizontalComponent
- Step2Component
- Step3Component
- Step4Component
- VerticalComponent
- ReportsComponent
- SaasComponent
- BaseTablesWidget1Component
- BaseTablesWidget2Component
- BaseTablesWidget6Component
- MixedWidget10Component
- MixedWidget11Component
- MixedWidget2Component
- MixedWidget3Component
- MixedWidget6Component
- MixedWidget7Component
- CardsWidget18Component
- CardsWidget20Component
- CardsWidget7Component
- EngageWidget10Component
- TablesWidget4Component
- TilesWidget1Component
- ConnectedAccountsComponent
- EmailPreferencesComponent
- NotificationsComponent
- Step1Component
- SidebarFooterComponent
- AccountingComponent
- ExtendedComponent
- AdvanceTablesWidget2Component
- AdvanceTablesWidget7Component
- charts-widget1.component.ts
- charts-widget2.component.ts
- getCSSVariableValue
- charts-widget7.component.ts
- charts-widget8.component.ts
- ListsWidget26Component
- TablesWidget16Component
- TablesWidget14Component
- TilesWidget11Component
- TilesWidget12Component
- AdvanceTablesWidget1Component
- FeedsWidget2Component
- FeedsWidget3Component
- FeedsWidget4Component
- FeedsWidget5Component
- FeedsWidget6Component
- ListsWidget4Component
- ListsWidget8Component
- MixedWidget1Component
- MixedWidget4Component
- MixedWidget5Component
- StatsWidget1Component
- StatsWidget2Component
- StatsWidget5Component
- TablesWidget10Component
- TablesWidget11Component
- TablesWidget12Component
- TablesWidget13Component
- TablesWidget3Component
- TilesWidget10Component
- TilesWidget13Component
- TilesWidget14Component
- TilesWidget3Component
- EngagesComponent
- DeactivateAccountComponent
- DomHelpers.ts
- ListsWidget3Component
- Step5Component

## God Nodes (most connected - your core abstractions)
1. `MenuComponent` - 61 edges
2. `getCSSVariableValue()` - 43 edges
3. `LayoutService` - 43 edges
4. `AuthService` - 37 edges
5. `DrawerComponent` - 33 edges
6. `StepperComponent` - 31 edges
7. `ScrollComponent` - 28 edges
8. `ILayout` - 25 edges
9. `StickyComponent` - 22 edges
10. `ToggleComponent` - 22 edges

## Surprising Connections (you probably didn't know these)
- `NavbarComponent` --references--> `UserType`  [EXTRACTED]
  _metronic/layout/components/header/navbar/navbar.component.ts → modules/auth/services/auth.service.ts
- `TopbarComponent` --references--> `UserType`  [EXTRACTED]
  _metronic/layout/components/topbar/topbar.component.ts → modules/auth/services/auth.service.ts
- `ChatInnerComponent` --references--> `UserType`  [EXTRACTED]
  _metronic/partials/content/chat-inner/chat-inner.component.ts → modules/auth/services/auth.service.ts
- `UserInnerComponent` --references--> `UserType`  [EXTRACTED]
  _metronic/partials/layout/extras/dropdown-inner/user-inner/user-inner.component.ts → modules/auth/services/auth.service.ts
- `UserListingComponent` --references--> `RoleModel`  [EXTRACTED]
  pages/user/user-listing/user-listing.component.ts → core/models/user-management.model.ts

## Import Cycles
- 4-file cycle: `_metronic/layout/index.ts -> _metronic/layout/layout.module.ts -> _metronic/partials/layout/extras/extras.module.ts -> _metronic/partials/layout/extras/dropdown-inner/notifications-inner/notifications-inner.component.ts -> _metronic/layout/index.ts`
- 5-file cycle: `_metronic/layout/index.ts -> _metronic/layout/layout.module.ts -> _metronic/partials/index.ts -> _metronic/partials/layout/extras/extras.module.ts -> _metronic/partials/layout/extras/dropdown-inner/notifications-inner/notifications-inner.component.ts -> _metronic/layout/index.ts`
- 5-file cycle: `_metronic/layout/index.ts -> _metronic/layout/layout.module.ts -> _metronic/partials/index.ts -> _metronic/partials/content/widgets/widgets.module.ts -> _metronic/partials/content/widgets/tiles/tiles-widget1/tiles-widget1.component.ts -> _metronic/layout/index.ts`

## Communities (151 total, 44 thin omitted)

### Community 0 - "MenuComponent"
Cohesion: 0.06
Nodes (6): MenuComponent, ToggleComponent, getElementChild(), LayoutScrollTopComponent, Component, HostBinding

### Community 1 - "ScrollComponent"
Cohesion: 0.05
Nodes (17): ScrollComponent, ScrollTopComponent, ScriptsInitComponent, Component, Error404Component, Component, Error500Component, Component (+9 more)

### Community 3 - "widgets.module.ts"
Cohesion: 0.07
Nodes (19): ListsWidget1Component, Component, ListsWidget2Component, Component, ListsWidget5Component, Component, ListsWidget6Component, Component (+11 more)

### Community 4 - "ChatInnerComponent"
Cohesion: 0.18
Nodes (10): ChatInnerComponent, Component, HostBinding, Input, ViewChild, defaultMessages, defaultUserInfos, messageFromClient (+2 more)

### Community 5 - "PermissionListingComponent"
Cohesion: 0.05
Nodes (17): DataTablesResponse, IPermissionModel, PermissionService, Injectable, DataTablesResponse, IRoleModel, RoleService, Injectable (+9 more)

### Community 6 - "chat.module.ts"
Cohesion: 0.09
Nodes (15): ChatComponent, Component, ChatModule, NgModule, ChatRoutingModule, routes, NgModule, DrawerChatComponent (+7 more)

### Community 7 - "partials/index.ts"
Cohesion: 0.09
Nodes (10): ModalConfig, ModalComponent, Component, Input, ViewChild, DashboardComponent, Component, ViewChild (+2 more)

### Community 8 - "DrawerComponent"
Cohesion: 0.09
Nodes (9): DrawerComponent, DrawerStore, components, KTHelpers, KTUtil, menuReinitialization(), NavbarComponent, Component (+1 more)

### Community 10 - "profile.module.ts"
Cohesion: 0.06
Nodes (26): Card2Component, Component, Input, IconUserModel, Component, Input, UserListComponent, NgModule (+18 more)

### Community 11 - "widgets-examples.module.ts"
Cohesion: 0.08
Nodes (19): ChartsComponent, Component, FeedsComponent, Component, ListsComponent, Component, MixedComponent, Component (+11 more)

### Community 12 - "UserModel"
Cohesion: 0.14
Nodes (7): UsersTable, AddressModel, AuthModel, SocialNetworksModel, UserModel, AuthHTTPService, Injectable

### Community 13 - "PageInfoService"
Cohesion: 0.13
Nodes (7): PageTitleComponent, Component, Input, PageInfo, PageInfoService, PageLink, Injectable

### Community 14 - "_utils/index.ts"
Cohesion: 0.11
Nodes (16): defaultDrawerOptions, DrawerOptions, defaultFeedbackOptions, FeedbackOptions, defaultPasswordMeterOptions, defaultPasswordMeterQueires, IPasswordMeterOptions, IPasswordMeterQueries (+8 more)

### Community 15 - "drawers.module.ts"
Cohesion: 0.15
Nodes (8): ChatInnerModule, NgModule, ActivityDrawerComponent, Component, DrawersModule, NgModule, MessengerDrawerComponent, Component

### Community 16 - "routing.ts"
Cohesion: 0.16
Nodes (11): CrudModule, NgModule, PermissionDetailsComponent, Component, PermissionModule, NgModule, RoleModule, NgModule (+3 more)

### Community 18 - "cards.module.ts"
Cohesion: 0.08
Nodes (18): Card1Component, Component, HostBinding, Input, Card3Component, Component, HostBinding, Input (+10 more)

### Community 19 - "ILayout"
Cohesion: 0.19
Nodes (6): HeaderComponent, Component, ILayout, LayoutComponent, Component, ViewChild

### Community 20 - "LayoutService"
Cohesion: 0.12
Nodes (6): LayoutService, Injectable, BuilderComponent, Tabs, Component, ViewChild

### Community 21 - "dropdown-menus.module.ts"
Cohesion: 0.11
Nodes (11): DropdownMenu1Component, Component, HostBinding, DropdownMenu2Component, Component, HostBinding, DropdownMenu3Component, Component (+3 more)

### Community 23 - "auth.module.ts"
Cohesion: 0.10
Nodes (12): AuthComponent, Component, AuthModule, NgModule, AuthRoutingModule, routes, NgModule, ErrorStates (+4 more)

### Community 24 - "auth.service.ts"
Cohesion: 0.11
Nodes (12): AppModule, NgModule, AppRoutingModule, routes, NgModule, AuthInterceptor, Injectable, FakeAPIService (+4 more)

### Community 25 - "FooterComponent"
Cohesion: 0.40
Nodes (3): FooterComponent, Component, Input

### Community 26 - "config.ts"
Cohesion: 0.19
Nodes (18): IApp, IContent, IEngage, IFooter, IGeneral, IHeader, IIllustrations, ILayoutComponent (+10 more)

### Community 27 - "LayoutType"
Cohesion: 0.24
Nodes (3): LayoutType, LayoutInitService, Injectable

### Community 28 - "engages.module.ts"
Cohesion: 0.13
Nodes (8): EngagesModule, NgModule, ExploreMainDrawerComponent, Component, HelpDrawerComponent, Component, PurchaseToolbarComponent, Component

### Community 29 - "components/index.ts"
Cohesion: 0.23
Nodes (5): CookieComponent, defaultScrollOptions, ScrollOptions, defaultToggleOptions, ToggleOptions

### Community 30 - "_ScrollTopComponent.ts"
Cohesion: 0.15
Nodes (9): defaultScrollTopOptions, IScrollTopOptions, defaultSwapperOptions, defaultSwapperQueires, ISwapperOptions, ISwapperQueries, getScrollTop(), throttle() (+1 more)

### Community 31 - "AuthService"
Cohesion: 0.20
Nodes (3): appInitializer(), AuthService, Injectable

### Community 33 - "app.component.ts"
Cohesion: 0.05
Nodes (24): AppComponent, Component, Mode, ThemeModeComponent, LanguageFlag, languages, Component, HostBinding (+16 more)

### Community 34 - "account.module.ts"
Cohesion: 0.18
Nodes (10): AccountComponent, Component, AccountModule, NgModule, AccountRoutingModule, routes, NgModule, SettingsComponent (+2 more)

### Community 35 - "auth-http.service.ts"
Cohesion: 0.16
Nodes (7): UserProfile, ApiEnvelope, OverviewComponent, Component, ProfileService, Injectable, AuthenticationResponse

### Community 36 - "modals.module.ts"
Cohesion: 0.16
Nodes (8): InviteUsersModalComponent, Component, MainModalComponent, Component, ModalsModule, NgModule, Component, UpgradePlanModalComponent

### Community 37 - "SplashScreenService"
Cohesion: 0.17
Nodes (7): SplashScreenComponent, Component, ViewChild, SplashScreenModule, NgModule, SplashScreenService, Injectable

### Community 38 - "CrudComponent"
Cohesion: 0.17
Nodes (5): CrudComponent, Component, Input, ViewChild, Output

### Community 39 - "RoleListingComponent"
Cohesion: 0.16
Nodes (6): RoleModel, RoleListingComponent, Component, ViewChild, RolesApiService, Injectable

### Community 40 - "StickyComponent"
Cohesion: 0.18
Nodes (5): defaultStickyOptions, StickyComponent, StickyOptions, getCSS(), getObjectPropertyValueByKey()

### Community 41 - "user-management.model.ts"
Cohesion: 0.24
Nodes (13): AdminUser, AdminUserDetail, CreateUserPayload, EditUserPayload, PaginatedResult, QueryCriteria, QueryFilter, QuerySort (+5 more)

### Community 43 - "UserListingComponent"
Cohesion: 0.21
Nodes (3): Component, ViewChild, UserListingComponent

### Community 45 - "charts-widget5.component.ts"
Cohesion: 0.40
Nodes (3): ChartsWidget5Component, getChartOptions(), Component

### Community 46 - "NewChartsWidget8Component"
Cohesion: 0.26
Nodes (6): getChart1Options(), getChart2Options(), NewChartsWidget8Component, Component, Input, ViewChild

### Community 48 - "notifications-inner.component.ts"
Cohesion: 0.17
Nodes (8): AlertModel, defaultAlerts, defaultLogs, LogModel, NotificationsInnerComponent, NotificationsTabsType, Component, HostBinding

### Community 49 - "layout.module.ts"
Cohesion: 0.12
Nodes (16): LayoutModule, routes, NgModule, QuickLinksInnerComponent, Component, HostBinding, ExtrasModule, NgModule (+8 more)

### Community 50 - "wizards.module.ts"
Cohesion: 0.36
Nodes (4): ICreateAccount, inits, NgModule, WizardsModule

### Community 54 - "SearchResultInnerComponent"
Cohesion: 0.18
Nodes (6): recentlySearchedModels, ResultModel, resultModels, SearchResultInnerComponent, Component, HostBinding

### Community 57 - "ToolbarComponent"
Cohesion: 0.24
Nodes (3): ToolbarComponent, Component, Input

### Community 58 - "layout.service.ts"
Cohesion: 0.27
Nodes (6): CSSClassesType, HTMLAttributesType, DarkSidebarConfig, LightSidebarConfig, getEmptyCssClasses(), getEmptyHTMLAttributes()

### Community 64 - "KeeniconComponent"
Cohesion: 0.25
Nodes (4): KeeniconComponent, Component, HostBinding, Input

### Community 65 - "wizards-routing.module.ts"
Cohesion: 0.25
Nodes (5): Component, WizardsComponent, routes, NgModule, WizardsRoutingModule

### Community 66 - "ContentComponent"
Cohesion: 0.29
Nodes (3): ContentComponent, Component, Input

### Community 68 - "SidebarLogoComponent"
Cohesion: 0.29
Nodes (3): SidebarLogoComponent, Component, Input

### Community 70 - "MixedWidget8Component"
Cohesion: 0.32
Nodes (4): getChartOptions(), MixedWidget8Component, Component, Input

### Community 71 - "MixedWidget9Component"
Cohesion: 0.32
Nodes (4): getChartOptions(), MixedWidget9Component, Component, Input

### Community 72 - "CardsWidget17Component"
Cohesion: 0.32
Nodes (4): CardsWidget17Component, initChart(), Component, Input

### Community 73 - "StatsWidget3Component"
Cohesion: 0.29
Nodes (5): getChartOptions(), StatsWidget3Component, Component, Input, ViewChild

### Community 74 - "StatsWidget4Component"
Cohesion: 0.29
Nodes (5): getChartOptions(), StatsWidget4Component, Component, Input, ViewChild

### Community 75 - "TablesWidget5Component"
Cohesion: 0.25
Nodes (3): TablesWidget5Component, Tabs, Component

### Community 76 - "TablesWidget6Component"
Cohesion: 0.25
Nodes (3): TablesWidget6Component, Tabs, Component

### Community 77 - "TablesWidget7Component"
Cohesion: 0.25
Nodes (3): TablesWidget7Component, Tabs, Component

### Community 78 - "TablesWidget8Component"
Cohesion: 0.25
Nodes (3): TablesWidget8Component, Tabs, Component

### Community 79 - "ProfileDetailsComponent"
Cohesion: 0.16
Nodes (4): ProfileDetailsComponent, Component, ViewChild, ConfirmPasswordValidator

### Community 80 - "charts-widget6.component.ts"
Cohesion: 0.40
Nodes (3): ChartsWidget6Component, getChartOptions(), Component

### Community 83 - "Step2Component"
Cohesion: 0.36
Nodes (3): Step2Component, Component, Input

### Community 84 - "Step3Component"
Cohesion: 0.36
Nodes (3): Step3Component, Component, Input

### Community 85 - "Step4Component"
Cohesion: 0.36
Nodes (3): Step4Component, Component, Input

### Community 87 - "ReportsComponent"
Cohesion: 0.33
Nodes (3): ReportsComponent, Component, Input

### Community 88 - "SaasComponent"
Cohesion: 0.33
Nodes (3): SaasComponent, Component, Input

### Community 89 - "BaseTablesWidget1Component"
Cohesion: 0.29
Nodes (3): BaseTablesWidget1Component, Component, Input

### Community 90 - "BaseTablesWidget2Component"
Cohesion: 0.29
Nodes (3): BaseTablesWidget2Component, Component, Input

### Community 91 - "BaseTablesWidget6Component"
Cohesion: 0.29
Nodes (3): BaseTablesWidget6Component, Component, Input

### Community 92 - "MixedWidget10Component"
Cohesion: 0.33
Nodes (4): getChartOptions(), MixedWidget10Component, Component, Input

### Community 93 - "MixedWidget11Component"
Cohesion: 0.33
Nodes (4): getChartOptions(), MixedWidget11Component, Component, Input

### Community 94 - "MixedWidget2Component"
Cohesion: 0.33
Nodes (4): getChartOptions(), MixedWidget2Component, Component, Input

### Community 95 - "MixedWidget3Component"
Cohesion: 0.33
Nodes (4): getChartOptions(), MixedWidget3Component, Component, Input

### Community 96 - "MixedWidget6Component"
Cohesion: 0.33
Nodes (4): getChartOptions(), MixedWidget6Component, Component, Input

### Community 97 - "MixedWidget7Component"
Cohesion: 0.33
Nodes (4): getChartOptions(), MixedWidget7Component, Component, Input

### Community 98 - "CardsWidget18Component"
Cohesion: 0.33
Nodes (3): CardsWidget18Component, Component, Input

### Community 99 - "CardsWidget20Component"
Cohesion: 0.33
Nodes (3): CardsWidget20Component, Component, Input

### Community 100 - "CardsWidget7Component"
Cohesion: 0.33
Nodes (3): CardsWidget7Component, Component, Input

### Community 101 - "EngageWidget10Component"
Cohesion: 0.33
Nodes (3): EngageWidget10Component, Component, Input

### Community 102 - "TablesWidget4Component"
Cohesion: 0.29
Nodes (3): TablesWidget4Component, Tabs, Component

### Community 103 - "TilesWidget1Component"
Cohesion: 0.38
Nodes (3): TilesWidget1Component, Component, Input

### Community 108 - "Step1Component"
Cohesion: 0.33
Nodes (3): Step1Component, Component, Input

### Community 114 - "AdvanceTablesWidget7Component"
Cohesion: 0.33
Nodes (3): AdvanceTablesWidget7Component, Component, Input

### Community 115 - "charts-widget1.component.ts"
Cohesion: 0.40
Nodes (3): ChartsWidget1Component, getChartOptions(), Component

### Community 116 - "charts-widget2.component.ts"
Cohesion: 0.40
Nodes (3): ChartsWidget2Component, getChartOptions(), Component

### Community 117 - "getCSSVariableValue"
Cohesion: 0.21
Nodes (7): getCSSVariableValue(), ChartsWidget3Component, getChartOptions(), Component, ChartsWidget4Component, getChartOptions(), Component

### Community 119 - "charts-widget7.component.ts"
Cohesion: 0.40
Nodes (3): ChartsWidget7Component, getChartOptions(), Component

### Community 120 - "charts-widget8.component.ts"
Cohesion: 0.40
Nodes (3): ChartsWidget8Component, getChartOptions(), Component

### Community 124 - "TilesWidget11Component"
Cohesion: 0.33
Nodes (3): TilesWidget11Component, Component, Input

### Community 125 - "TilesWidget12Component"
Cohesion: 0.33
Nodes (3): TilesWidget12Component, Component, Input

### Community 129 - "AdvanceTablesWidget1Component"
Cohesion: 0.40
Nodes (3): AdvanceTablesWidget1Component, Component, Input

### Community 135 - "ListsWidget4Component"
Cohesion: 0.40
Nodes (3): ListsWidget4Component, Component, Input

### Community 136 - "ListsWidget8Component"
Cohesion: 0.40
Nodes (3): ListsWidget8Component, Component, Input

### Community 137 - "MixedWidget1Component"
Cohesion: 0.40
Nodes (3): MixedWidget1Component, Component, Input

### Community 138 - "MixedWidget4Component"
Cohesion: 0.40
Nodes (3): MixedWidget4Component, Component, Input

### Community 139 - "MixedWidget5Component"
Cohesion: 0.40
Nodes (3): MixedWidget5Component, Component, Input

### Community 140 - "StatsWidget1Component"
Cohesion: 0.40
Nodes (3): StatsWidget1Component, Component, Input

### Community 141 - "StatsWidget2Component"
Cohesion: 0.40
Nodes (3): StatsWidget2Component, Component, Input

### Community 142 - "StatsWidget5Component"
Cohesion: 0.40
Nodes (3): StatsWidget5Component, Component, Input

### Community 148 - "TilesWidget10Component"
Cohesion: 0.40
Nodes (3): TilesWidget10Component, Component, Input

### Community 149 - "TilesWidget13Component"
Cohesion: 0.40
Nodes (3): TilesWidget13Component, Component, Input

### Community 150 - "TilesWidget14Component"
Cohesion: 0.40
Nodes (3): TilesWidget14Component, Component, Input

### Community 151 - "TilesWidget3Component"
Cohesion: 0.40
Nodes (3): TilesWidget3Component, Component, Input

### Community 154 - "DomHelpers.ts"
Cohesion: 0.10
Nodes (23): defaultMenuOptions, MenuOptions, PopperPlacement, TODO: not done, getAttributeValueByBreakpoint(), getBreakpoint(), getElementActualCss(), getElementActualHeight() (+15 more)

## Knowledge Gaps
- **68 isolated node(s):** `DataTablesResponse`, `DataTablesResponse`, `EventMeta`, `MenuOptions`, `defaultMenuOptions` (+63 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **44 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `SharedModule` connect `layout.module.ts` to `account.module.ts`, `widgets.module.ts`, `modals.module.ts`, `chat.module.ts`, `profile.module.ts`, `drawers.module.ts`, `routing.ts`, `cards.module.ts`, `wizards.module.ts`, `engages.module.ts`?**
  _High betweenness centrality (0.142) - this node is a cross-community bridge._
- **Why does `MenuComponent` connect `MenuComponent` to `ScrollComponent`, `DrawerComponent`, `.on`, `ILayout`, `.off`, `DomHelpers.ts`, `.one`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **Why does `AuthService` connect `AuthService` to `app.component.ts`, `account.module.ts`, `auth-http.service.ts`, `ChatInnerComponent`, `DrawerComponent`, `topbar.component.ts`, `ProfileDetailsComponent`, `RegistrationComponent`, `auth.module.ts`, `auth.service.ts`, `LoginComponent`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **What connects `DataTablesResponse`, `DataTablesResponse`, `EventMeta` to the rest of the system?**
  _68 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `MenuComponent` be split into smaller, more focused modules?**
  _Cohesion score 0.05906553041434029 - nodes in this community are weakly interconnected._
- **Should `ScrollComponent` be split into smaller, more focused modules?**
  _Cohesion score 0.052429667519181586 - nodes in this community are weakly interconnected._
- **Should `widgets.module.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06543385490753911 - nodes in this community are weakly interconnected._