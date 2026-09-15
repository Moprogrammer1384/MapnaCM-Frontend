# Graph Report - app  (2026-09-15)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1891 nodes · 3397 edges · 155 communities (115 shown, 40 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 68 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `13e1be5d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32
- Community 33
- Community 34
- Community 35
- Community 36
- Community 37
- Community 38
- Community 39
- Community 40
- Community 41
- Community 42
- Community 43
- Community 44
- Community 45
- Community 46
- Community 47
- Community 48
- Community 49
- Community 50
- Community 51
- Community 52
- Community 53
- Community 54
- Community 55
- Community 56
- Community 57
- Community 58
- Community 59
- Community 60
- Community 61
- Community 62
- Community 63
- Community 64
- Community 65
- Community 66
- Community 67
- Community 68
- Community 69
- Community 70
- Community 71
- Community 72
- Community 73
- Community 74
- Community 75
- Community 76
- Community 77
- Community 78
- Community 79
- Community 80
- Community 81
- Community 82
- Community 83
- Community 84
- Community 85
- Community 86
- Community 87
- Community 88
- Community 89
- Community 90
- Community 91
- Community 92
- Community 93
- Community 94
- Community 95
- Community 96
- Community 97
- Community 98
- Community 99
- Community 100
- Community 101
- Community 102
- Community 103
- Community 104
- Community 105
- Community 106
- Community 108
- Community 109
- Community 110
- Community 111
- Community 112
- Community 113
- Community 114
- Community 115
- Community 116
- Community 117
- Community 118
- Community 119
- Community 120
- Community 121
- Community 122
- Community 123
- Community 124
- Community 125
- Community 128
- Community 129
- Community 130
- Community 131
- Community 132
- Community 133
- Community 134
- Community 135
- Community 136
- Community 137
- Community 138
- Community 139
- Community 140
- Community 141
- Community 142
- Community 143
- Community 144
- Community 145
- Community 146
- Community 147
- Community 148
- Community 149
- Community 150
- Community 151
- Community 152
- Community 153
- Community 154
- Community 155
- Community 156
- Community 157

## God Nodes (most connected - your core abstractions)
1. `MenuComponent` - 61 edges
2. `LayoutService` - 43 edges
3. `getCSSVariableValue()` - 43 edges
4. `AuthService` - 37 edges
5. `DrawerComponent` - 33 edges
6. `StepperComponent` - 31 edges
7. `ScrollComponent` - 28 edges
8. `ILayout` - 25 edges
9. `ToggleComponent` - 22 edges
10. `StickyComponent` - 22 edges

## Surprising Connections (you probably didn't know these)
- `ProjectsComponent` --references--> `IconUserModel`  [EXTRACTED]
  modules/profile/projects/projects.component.ts → _metronic/partials/content/cards/icon-user.model.ts
- `ChatInnerComponent` --references--> `UserType`  [EXTRACTED]
  _metronic/partials/content/chat-inner/chat-inner.component.ts → modules/auth/services/auth.service.ts
- `UserInnerComponent` --references--> `UserType`  [EXTRACTED]
  _metronic/partials/layout/extras/dropdown-inner/user-inner/user-inner.component.ts → modules/auth/services/auth.service.ts
- `DashboardComponent` --references--> `ModalConfig`  [EXTRACTED]
  pages/dashboard/dashboard.component.ts → _metronic/partials/layout/modals/modal.config.ts
- `DashboardComponent` --references--> `ModalComponent`  [EXTRACTED]
  pages/dashboard/dashboard.component.ts → _metronic/partials/layout/modals/modal/modal.component.ts

## Import Cycles
- 4-file cycle: `_metronic/layout/index.ts -> _metronic/layout/layout.module.ts -> _metronic/partials/layout/extras/extras.module.ts -> _metronic/partials/layout/extras/dropdown-inner/notifications-inner/notifications-inner.component.ts -> _metronic/layout/index.ts`
- 5-file cycle: `_metronic/layout/index.ts -> _metronic/layout/layout.module.ts -> _metronic/partials/index.ts -> _metronic/partials/layout/extras/extras.module.ts -> _metronic/partials/layout/extras/dropdown-inner/notifications-inner/notifications-inner.component.ts -> _metronic/layout/index.ts`
- 5-file cycle: `_metronic/layout/index.ts -> _metronic/layout/layout.module.ts -> _metronic/partials/index.ts -> _metronic/partials/content/widgets/widgets.module.ts -> _metronic/partials/content/widgets/tiles/tiles-widget1/tiles-widget1.component.ts -> _metronic/layout/index.ts`

## Communities (155 total, 40 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (21): defaultMenuOptions, MenuComponent, MenuOptions, PopperPlacement, TODO: not done, DataUtil, getElementActualCss(), getElementActualHeight() (+13 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (11): ScrollComponent, ToggleComponent, PageTitleComponent, Component, Input, ScriptsInitComponent, Component, PageInfo (+3 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (19): ListsWidget1Component, Component, ListsWidget2Component, Component, ListsWidget5Component, Component, ListsWidget6Component, Component (+11 more)

### Community 4 - "Community 4"
Cohesion: 0.18
Nodes (10): ChatInnerComponent, Component, HostBinding, Input, ViewChild, defaultMessages, defaultUserInfos, messageFromClient (+2 more)

### Community 5 - "Community 5"
Cohesion: 0.05
Nodes (18): DataTablesResponse, IRoleModel, RoleService, Injectable, DataTablesResponse, IUserModel, Injectable, UserService (+10 more)

### Community 6 - "Community 6"
Cohesion: 0.09
Nodes (15): ChatComponent, Component, ChatModule, NgModule, ChatRoutingModule, routes, NgModule, DrawerChatComponent (+7 more)

### Community 10 - "Community 10"
Cohesion: 0.11
Nodes (15): CampaignsComponent, Component, ConnectionsComponent, Component, DocumentsComponent, Component, OverviewComponent, Component (+7 more)

### Community 11 - "Community 11"
Cohesion: 0.08
Nodes (19): ChartsComponent, Component, FeedsComponent, Component, ListsComponent, Component, MixedComponent, Component (+11 more)

### Community 12 - "Community 12"
Cohesion: 0.15
Nodes (8): ApiEnvelope, AddressModel, AuthModel, SocialNetworksModel, UserModel, AuthenticationResponse, AuthHTTPService, Injectable

### Community 13 - "Community 13"
Cohesion: 0.12
Nodes (7): DataTablesResponse, IPermissionModel, PermissionService, Injectable, PermissionListingComponent, Component, ViewChild

### Community 14 - "Community 14"
Cohesion: 0.13
Nodes (13): defaultDrawerOptions, DrawerOptions, defaultFeedbackOptions, FeedbackOptions, defaultStepperOptions, IStepperOptions, DOMEventHandlerUtil, getElementIndex() (+5 more)

### Community 15 - "Community 15"
Cohesion: 0.15
Nodes (8): ChatInnerModule, NgModule, ActivityDrawerComponent, Component, DrawersModule, NgModule, MessengerDrawerComponent, Component

### Community 16 - "Community 16"
Cohesion: 0.14
Nodes (14): SharedModule, NgModule, CrudModule, NgModule, BuilderModule, NgModule, PermissionDetailsComponent, Component (+6 more)

### Community 18 - "Community 18"
Cohesion: 0.10
Nodes (14): Card1Component, Component, HostBinding, Input, Card3Component, Component, HostBinding, Input (+6 more)

### Community 19 - "Community 19"
Cohesion: 0.19
Nodes (6): HeaderComponent, Component, ILayout, LayoutComponent, Component, ViewChild

### Community 20 - "Community 20"
Cohesion: 0.12
Nodes (6): LayoutService, Injectable, BuilderComponent, Tabs, Component, ViewChild

### Community 21 - "Community 21"
Cohesion: 0.11
Nodes (11): DropdownMenu1Component, Component, HostBinding, DropdownMenu2Component, Component, HostBinding, DropdownMenu3Component, Component (+3 more)

### Community 23 - "Community 23"
Cohesion: 0.11
Nodes (12): AuthComponent, Component, AuthModule, NgModule, AuthRoutingModule, routes, NgModule, ErrorStates (+4 more)

### Community 24 - "Community 24"
Cohesion: 0.16
Nodes (10): AppModule, NgModule, AppRoutingModule, routes, NgModule, AuthInterceptor, Injectable, AuthGuard (+2 more)

### Community 25 - "Community 25"
Cohesion: 0.13
Nodes (11): FooterComponent, Component, Input, SidebarMenuComponent, Component, LayoutModule, routes, NgModule (+3 more)

### Community 26 - "Community 26"
Cohesion: 0.19
Nodes (18): IApp, IContent, IEngage, IFooter, IGeneral, IHeader, IIllustrations, ILayoutComponent (+10 more)

### Community 27 - "Community 27"
Cohesion: 0.24
Nodes (3): LayoutType, LayoutInitService, Injectable

### Community 28 - "Community 28"
Cohesion: 0.13
Nodes (8): EngagesModule, NgModule, ExploreMainDrawerComponent, Component, HelpDrawerComponent, Component, PurchaseToolbarComponent, Component

### Community 29 - "Community 29"
Cohesion: 0.15
Nodes (8): CookieComponent, defaultScrollOptions, ScrollOptions, defaultToggleOptions, ToggleOptions, components, KTHelpers, KTUtil

### Community 30 - "Community 30"
Cohesion: 0.20
Nodes (5): defaultScrollTopOptions, IScrollTopOptions, ScrollTopComponent, getScrollTop(), throttle()

### Community 31 - "Community 31"
Cohesion: 0.16
Nodes (3): appInitializer(), AuthService, Injectable

### Community 32 - "Community 32"
Cohesion: 0.16
Nodes (5): defaultStickyOptions, StickyOptions, getCSS(), getElementOffset(), ElementAnimateUtil

### Community 33 - "Community 33"
Cohesion: 0.18
Nodes (6): ThemeModeService, ThemeModeType, Injectable, ThemeModeSwitcherComponent, Component, Input

### Community 34 - "Community 34"
Cohesion: 0.18
Nodes (9): AccountComponent, Component, AccountModule, NgModule, AccountRoutingModule, routes, NgModule, SettingsComponent (+1 more)

### Community 35 - "Community 35"
Cohesion: 0.24
Nodes (5): UserProfile, OverviewComponent, Component, ProfileService, Injectable

### Community 36 - "Community 36"
Cohesion: 0.19
Nodes (6): InviteUsersModalComponent, Component, MainModalComponent, Component, Component, UpgradePlanModalComponent

### Community 37 - "Community 37"
Cohesion: 0.17
Nodes (7): SplashScreenComponent, Component, ViewChild, SplashScreenModule, NgModule, SplashScreenService, Injectable

### Community 38 - "Community 38"
Cohesion: 0.17
Nodes (5): CrudComponent, Component, Input, ViewChild, Output

### Community 39 - "Community 39"
Cohesion: 0.18
Nodes (7): Error500Component, Component, ErrorsModule, NgModule, ErrorsRoutingModule, routes, NgModule

### Community 41 - "Community 41"
Cohesion: 0.16
Nodes (4): Mode, ThemeModeComponent, Error404Component, Component

### Community 42 - "Community 42"
Cohesion: 0.20
Nodes (7): Card2Component, Component, Input, IconUserModel, Component, Input, UserListComponent

### Community 43 - "Community 43"
Cohesion: 0.23
Nodes (6): locale, locale, locale, locale, locale, locale

### Community 44 - "Community 44"
Cohesion: 0.21
Nodes (3): LayoutScrollTopComponent, Component, HostBinding

### Community 45 - "Community 45"
Cohesion: 0.21
Nodes (7): getCSSVariableValue(), ChartsWidget5Component, getChartOptions(), Component, ChartsWidget6Component, getChartOptions(), Component

### Community 46 - "Community 46"
Cohesion: 0.26
Nodes (6): getChart1Options(), getChart2Options(), NewChartsWidget8Component, Component, Input, ViewChild

### Community 47 - "Community 47"
Cohesion: 0.14
Nodes (9): menuReinitialization(), NavbarComponent, Component, Input, TopbarComponent, Component, LanguageFlag, languages (+1 more)

### Community 48 - "Community 48"
Cohesion: 0.17
Nodes (8): AlertModel, defaultAlerts, defaultLogs, LogModel, NotificationsInnerComponent, NotificationsTabsType, Component, HostBinding

### Community 49 - "Community 49"
Cohesion: 0.20
Nodes (7): QuickLinksInnerComponent, Component, HostBinding, ExtrasModule, NgModule, TranslationModule, NgModule

### Community 50 - "Community 50"
Cohesion: 0.36
Nodes (4): ICreateAccount, inits, NgModule, WizardsModule

### Community 51 - "Community 51"
Cohesion: 0.22
Nodes (5): AppComponent, Component, Locale, TranslationService, Injectable

### Community 52 - "Community 52"
Cohesion: 0.17
Nodes (9): NgModule, WidgetsModule, ModalsModule, NgModule, DashboardComponent, Component, ViewChild, DashboardModule (+1 more)

### Community 53 - "Community 53"
Cohesion: 0.24
Nodes (5): defaultSwapperOptions, defaultSwapperQueires, ISwapperOptions, ISwapperQueries, SwapperStore

### Community 54 - "Community 54"
Cohesion: 0.18
Nodes (6): recentlySearchedModels, ResultModel, resultModels, SearchResultInnerComponent, Component, HostBinding

### Community 55 - "Community 55"
Cohesion: 0.22
Nodes (3): ConfirmPasswordValidator, RegistrationComponent, Component

### Community 57 - "Community 57"
Cohesion: 0.24
Nodes (3): ToolbarComponent, Component, Input

### Community 58 - "Community 58"
Cohesion: 0.27
Nodes (6): CSSClassesType, HTMLAttributesType, DarkSidebarConfig, LightSidebarConfig, getEmptyCssClasses(), getEmptyHTMLAttributes()

### Community 60 - "Community 60"
Cohesion: 0.22
Nodes (4): BODY_CLASSES, ErrorsComponent, Component, HostBinding

### Community 61 - "Community 61"
Cohesion: 0.28
Nodes (3): FakeAPIService, Injectable, UsersTable

### Community 62 - "Community 62"
Cohesion: 0.25
Nodes (4): ModalComponent, Component, Input, ViewChild

### Community 63 - "Community 63"
Cohesion: 0.28
Nodes (3): Component, HostBinding, UserInnerComponent

### Community 64 - "Community 64"
Cohesion: 0.25
Nodes (4): KeeniconComponent, Component, HostBinding, Input

### Community 65 - "Community 65"
Cohesion: 0.25
Nodes (5): Component, WizardsComponent, routes, NgModule, WizardsRoutingModule

### Community 66 - "Community 66"
Cohesion: 0.29
Nodes (3): ContentComponent, Component, Input

### Community 68 - "Community 68"
Cohesion: 0.29
Nodes (3): SidebarLogoComponent, Component, Input

### Community 70 - "Community 70"
Cohesion: 0.32
Nodes (4): getChartOptions(), MixedWidget8Component, Component, Input

### Community 71 - "Community 71"
Cohesion: 0.32
Nodes (4): getChartOptions(), MixedWidget9Component, Component, Input

### Community 72 - "Community 72"
Cohesion: 0.32
Nodes (4): CardsWidget17Component, initChart(), Component, Input

### Community 73 - "Community 73"
Cohesion: 0.29
Nodes (5): getChartOptions(), StatsWidget3Component, Component, Input, ViewChild

### Community 74 - "Community 74"
Cohesion: 0.29
Nodes (5): getChartOptions(), StatsWidget4Component, Component, Input, ViewChild

### Community 75 - "Community 75"
Cohesion: 0.25
Nodes (3): TablesWidget5Component, Tabs, Component

### Community 76 - "Community 76"
Cohesion: 0.25
Nodes (3): TablesWidget6Component, Tabs, Component

### Community 77 - "Community 77"
Cohesion: 0.25
Nodes (3): TablesWidget7Component, Tabs, Component

### Community 78 - "Community 78"
Cohesion: 0.25
Nodes (3): TablesWidget8Component, Tabs, Component

### Community 79 - "Community 79"
Cohesion: 0.25
Nodes (3): ProfileDetailsComponent, Component, ViewChild

### Community 83 - "Community 83"
Cohesion: 0.36
Nodes (3): Step2Component, Component, Input

### Community 84 - "Community 84"
Cohesion: 0.36
Nodes (3): Step3Component, Component, Input

### Community 85 - "Community 85"
Cohesion: 0.36
Nodes (3): Step4Component, Component, Input

### Community 87 - "Community 87"
Cohesion: 0.33
Nodes (3): ReportsComponent, Component, Input

### Community 88 - "Community 88"
Cohesion: 0.33
Nodes (3): SaasComponent, Component, Input

### Community 89 - "Community 89"
Cohesion: 0.29
Nodes (3): BaseTablesWidget1Component, Component, Input

### Community 90 - "Community 90"
Cohesion: 0.29
Nodes (3): BaseTablesWidget2Component, Component, Input

### Community 91 - "Community 91"
Cohesion: 0.29
Nodes (3): BaseTablesWidget6Component, Component, Input

### Community 92 - "Community 92"
Cohesion: 0.33
Nodes (4): getChartOptions(), MixedWidget10Component, Component, Input

### Community 93 - "Community 93"
Cohesion: 0.33
Nodes (4): getChartOptions(), MixedWidget11Component, Component, Input

### Community 94 - "Community 94"
Cohesion: 0.33
Nodes (4): getChartOptions(), MixedWidget2Component, Component, Input

### Community 95 - "Community 95"
Cohesion: 0.33
Nodes (4): getChartOptions(), MixedWidget3Component, Component, Input

### Community 96 - "Community 96"
Cohesion: 0.33
Nodes (4): getChartOptions(), MixedWidget6Component, Component, Input

### Community 97 - "Community 97"
Cohesion: 0.33
Nodes (4): getChartOptions(), MixedWidget7Component, Component, Input

### Community 98 - "Community 98"
Cohesion: 0.33
Nodes (3): CardsWidget18Component, Component, Input

### Community 99 - "Community 99"
Cohesion: 0.33
Nodes (3): CardsWidget20Component, Component, Input

### Community 100 - "Community 100"
Cohesion: 0.33
Nodes (3): CardsWidget7Component, Component, Input

### Community 101 - "Community 101"
Cohesion: 0.33
Nodes (3): EngageWidget10Component, Component, Input

### Community 102 - "Community 102"
Cohesion: 0.29
Nodes (3): TablesWidget4Component, Tabs, Component

### Community 103 - "Community 103"
Cohesion: 0.38
Nodes (3): TilesWidget1Component, Component, Input

### Community 108 - "Community 108"
Cohesion: 0.33
Nodes (3): Step1Component, Component, Input

### Community 112 - "Community 112"
Cohesion: 0.33
Nodes (4): Card4Component, Component, HostBinding, Input

### Community 114 - "Community 114"
Cohesion: 0.33
Nodes (3): AdvanceTablesWidget7Component, Component, Input

### Community 115 - "Community 115"
Cohesion: 0.40
Nodes (3): ChartsWidget1Component, getChartOptions(), Component

### Community 116 - "Community 116"
Cohesion: 0.40
Nodes (3): ChartsWidget2Component, getChartOptions(), Component

### Community 117 - "Community 117"
Cohesion: 0.40
Nodes (3): ChartsWidget3Component, getChartOptions(), Component

### Community 118 - "Community 118"
Cohesion: 0.40
Nodes (3): ChartsWidget4Component, getChartOptions(), Component

### Community 119 - "Community 119"
Cohesion: 0.40
Nodes (3): ChartsWidget7Component, getChartOptions(), Component

### Community 120 - "Community 120"
Cohesion: 0.40
Nodes (3): ChartsWidget8Component, getChartOptions(), Component

### Community 124 - "Community 124"
Cohesion: 0.33
Nodes (3): TilesWidget11Component, Component, Input

### Community 125 - "Community 125"
Cohesion: 0.33
Nodes (3): TilesWidget12Component, Component, Input

### Community 128 - "Community 128"
Cohesion: 0.40
Nodes (4): defaultPasswordMeterOptions, defaultPasswordMeterQueires, IPasswordMeterOptions, IPasswordMeterQueries

### Community 129 - "Community 129"
Cohesion: 0.40
Nodes (3): AdvanceTablesWidget1Component, Component, Input

### Community 135 - "Community 135"
Cohesion: 0.40
Nodes (3): ListsWidget4Component, Component, Input

### Community 136 - "Community 136"
Cohesion: 0.40
Nodes (3): ListsWidget8Component, Component, Input

### Community 137 - "Community 137"
Cohesion: 0.40
Nodes (3): MixedWidget1Component, Component, Input

### Community 138 - "Community 138"
Cohesion: 0.40
Nodes (3): MixedWidget4Component, Component, Input

### Community 139 - "Community 139"
Cohesion: 0.40
Nodes (3): MixedWidget5Component, Component, Input

### Community 140 - "Community 140"
Cohesion: 0.40
Nodes (3): StatsWidget1Component, Component, Input

### Community 141 - "Community 141"
Cohesion: 0.40
Nodes (3): StatsWidget2Component, Component, Input

### Community 142 - "Community 142"
Cohesion: 0.40
Nodes (3): StatsWidget5Component, Component, Input

### Community 148 - "Community 148"
Cohesion: 0.40
Nodes (3): TilesWidget10Component, Component, Input

### Community 149 - "Community 149"
Cohesion: 0.40
Nodes (3): TilesWidget13Component, Component, Input

### Community 150 - "Community 150"
Cohesion: 0.40
Nodes (3): TilesWidget14Component, Component, Input

### Community 151 - "Community 151"
Cohesion: 0.40
Nodes (3): TilesWidget3Component, Component, Input

### Community 154 - "Community 154"
Cohesion: 0.67
Nodes (4): getAttributeValueByBreakpoint(), getBreakpoint(), getViewPort(), isMobileDevice()

## Knowledge Gaps
- **63 isolated node(s):** `MenuOptions`, `PopperPlacement`, `PageInfo`, `Tabs`, `AuthenticationResponse` (+58 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **40 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `SharedModule` connect `Community 16` to `Community 34`, `Community 3`, `Community 36`, `Community 6`, `Community 10`, `Community 15`, `Community 49`, `Community 18`, `Community 50`, `Community 25`, `Community 28`?**
  _High betweenness centrality (0.157) - this node is a cross-community bridge._
- **Why does `MenuComponent` connect `Community 0` to `Community 1`, `Community 2`, `Community 39`, `Community 41`, `Community 44`, `Community 17`, `Community 19`, `Community 60`, `Community 29`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Why does `LayoutService` connect `Community 20` to `Community 1`, `Community 67`, `Community 68`, `Community 69`, `Community 103`, `Community 47`, `Community 48`, `Community 19`, `Community 57`, `Community 58`, `Community 27`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **What connects `MenuOptions`, `PopperPlacement`, `PageInfo` to the rest of the system?**
  _63 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05854341736694678 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05456095481670929 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.08108108108108109 - nodes in this community are weakly interconnected._