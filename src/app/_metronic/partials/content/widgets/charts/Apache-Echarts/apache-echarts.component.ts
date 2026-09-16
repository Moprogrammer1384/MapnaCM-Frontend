import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as echarts from 'echarts';
import type { ECharts, EChartsOption } from 'echarts';
import jquery from 'jquery';

export type ApacheEchartsRenderer = 'canvas' | 'svg';
export type ApacheEchartsCleanup = () => void;

export interface ApacheEchartsInitializerContext {
  readonly element: HTMLDivElement;
  readonly renderer: ApacheEchartsRenderer;
  readonly theme?: string | object;
}

export type ApacheEchartsInitializer = (
  chart: ECharts,
  context: ApacheEchartsInitializerContext
) => void | ApacheEchartsCleanup | Promise<void | ApacheEchartsCleanup>;

interface ExampleApp {
  config?: Record<string, unknown>;
  configParameters?: Record<string, ExampleControlParameters>;
  __internalAPI: {
    retrieveViewCoordSysRects: (
      chart: ECharts,
      query: Record<string, unknown>
    ) => { viewRect: unknown; contentBoundingRect: unknown };
  };
  [key: string]: unknown;
}

interface ExampleControlParameters {
  min?: number;
  max?: number;
  step?: number;
  options?: readonly unknown[] | Record<string, unknown>;
}

interface ExampleControl {
  readonly key: string;
  readonly label: string;
  readonly kind: 'boolean' | 'number' | 'select' | 'color' | 'text' | 'action';
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly options?: readonly { label: string; value: unknown }[];
  value: unknown;
}

interface TrackedListener {
  readonly target: Document | Window;
  readonly type: string;
  readonly listener: EventListenerOrEventListenerObject;
  readonly options?: boolean | AddEventListenerOptions;
}

@Component({
  selector: 'app-apache-echarts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './apache-echarts.component.html',
  styleUrls: ['./apache-echarts.component.scss'],
})
export class ApacheEchartsComponent
  implements AfterViewInit, OnChanges, OnDestroy
{
  @ViewChild('chartElement', { static: true })
  private chartElement!: ElementRef<HTMLDivElement>;

  @Input() options: EChartsOption | null = null;
  @Input() demoId: string | null = null;
  @Input() initializer: ApacheEchartsInitializer | null = null;
  @Input() renderer: ApacheEchartsRenderer = 'canvas';
  @Input() theme?: string | object;
  @Input() height = '400px';

  @Output() readonly chartInit = new EventEmitter<ECharts>();
  @Output() readonly chartRendered = new EventEmitter<ECharts>();
  @Output() readonly chartError = new EventEmitter<unknown>();

  loading = false;
  errorMessage = '';
  controls: ExampleControl[] = [];

  private chart?: ECharts;
  private resizeObserver?: ResizeObserver;
  private cleanupInitializer?: ApacheEchartsCleanup;
  private executionVersion = 0;
  private viewReady = false;
  private app?: ExampleApp;
  private readonly intervalIds = new Set<number>();
  private readonly timeoutIds = new Set<number>();
  private readonly listeners: TrackedListener[] = [];
  private static readonly scriptPromises = new Map<string, Promise<void>>();

  constructor(
    private readonly changeDetector: ChangeDetectorRef,
    private readonly zone: NgZone
  ) {}

  ngAfterViewInit(): void {
    this.viewReady = true;
    void this.initializeChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.viewReady) {
      return;
    }

    const shouldRecreate =
      changes['demoId'] ||
      changes['initializer'] ||
      changes['renderer'] ||
      changes['theme'];

    if (shouldRecreate) {
      void this.initializeChart();
      return;
    }

    if (changes['options'] && this.chart && this.options) {
      this.chart.setOption(this.options, true);
    }
  }

  ngOnDestroy(): void {
    this.executionVersion++;
    this.destroyRuntime();
    this.disposeChart();
  }

  updateControl(control: ExampleControl, rawValue: unknown): void {
    if (!this.app?.config) {
      return;
    }

    if (control.kind === 'action') {
      const action = this.app.config[control.key];
      if (typeof action === 'function') {
        action();
      }
      return;
    }

    let value = rawValue;
    if (control.kind === 'number') {
      value = Number(rawValue);
    } else if (control.kind === 'boolean') {
      value = Boolean(rawValue);
    } else if (control.kind === 'select' && control.options) {
      const selected = control.options.find(
        (option) => String(option.value) === String(rawValue)
      );
      value = selected?.value ?? rawValue;
    }

    control.value = value;
    this.app.config[control.key] = value;
    const onChange = this.app.config['onChange'];
    if (typeof onChange === 'function') {
      onChange();
    }
  }

  private async initializeChart(): Promise<void> {
    const version = ++this.executionVersion;
    this.loading = Boolean(this.demoId || this.initializer);
    this.errorMessage = '';
    this.controls = [];
    this.changeDetector.detectChanges();

    this.destroyRuntime();
    this.disposeChart();

    await this.zone.runOutsideAngular(async () => {
      try {
        const chart = echarts.init(this.chartElement.nativeElement, this.theme, {
          renderer: this.renderer,
        });
        if (version !== this.executionVersion) {
          chart.dispose();
          return;
        }

        this.chart = chart;
        chart.on('rendered', () => {
          this.zone.run(() => this.chartRendered.emit(chart));
        });
        this.observeResize();
        this.zone.run(() => this.chartInit.emit(chart));

        if (this.options) {
          chart.setOption(this.options, true);
        }

        if (this.initializer) {
          const cleanup = await this.initializer(chart, {
            element: this.chartElement.nativeElement,
            renderer: this.renderer,
            theme: this.theme,
          });
          if (typeof cleanup === 'function') {
            this.cleanupInitializer = cleanup;
          }
        }

        if (this.demoId) {
          await this.runOfficialExample(this.demoId, chart);
        }

        if (version === this.executionVersion) {
          this.zone.run(() => {
            this.loading = false;
            this.changeDetector.markForCheck();
          });
        }
      } catch (error) {
        if (version === this.executionVersion) {
          this.zone.run(() => {
            this.loading = false;
            this.errorMessage =
              error instanceof Error ? error.message : 'Unable to render chart.';
            this.chartError.emit(error);
            this.changeDetector.markForCheck();
          });
        }
      }
    });
  }

  private async runOfficialExample(demoId: string, chart: ECharts): Promise<void> {
    const assetRoot = new URL('assets/apache-echarts/', document.baseURI).href;
    const response = await fetch(
      new URL(`examples/${demoId}.js`, assetRoot).href,
      { cache: 'force-cache' }
    );
    if (!response.ok) {
      throw new Error(`Unable to load ${demoId} (${response.status}).`);
    }

    const code = await response.text();
    await this.ensureDependencies(code, assetRoot);

    const app = this.createExampleApp();
    this.app = app;
    const scopedJQuery = this.createScopedJQuery();
    const scopedDocument = this.createScopedDocument();
    const scopedWindow = this.createScopedWindow();
    const trackedSetTimeout = this.createTrackedSetTimeout();
    const trackedSetInterval = this.createTrackedSetInterval();
    const trackedClearTimeout = (id: number): void => {
      window.clearTimeout(id);
      this.timeoutIds.delete(id);
    };
    const trackedClearInterval = (id: number): void => {
      window.clearInterval(id);
      this.intervalIds.delete(id);
    };

    const runner = new Function(
      'myChart',
      'app',
      'setTimeout',
      'setInterval',
      'clearTimeout',
      'clearInterval',
      'ROOT_PATH',
      'CDN_PATH',
      'echarts',
      '$',
      'ecStat',
      'document',
      'window',
      'self',
      'globalThis',
      `var option, css;\n${code}\nreturn [option, css];`
    ) as (...parameters: unknown[]) => [EChartsOption | undefined, string | undefined];

    const [option] = runner(
      chart,
      app,
      trackedSetTimeout,
      trackedSetInterval,
      trackedClearTimeout,
      trackedClearInterval,
      assetRoot.replace(/\/$/, ''),
      new URL('vendor/', assetRoot).href,
      echarts,
      scopedJQuery,
      (window as unknown as Record<string, unknown>)['ecStat'],
      scopedDocument,
      scopedWindow,
      scopedWindow,
      scopedWindow
    );

    if (option && typeof option === 'object') {
      chart.setOption(option, true);
    }
    this.zone.run(() => {
      this.controls = this.createControls(app);
      this.changeDetector.markForCheck();
    });
  }

  private async ensureDependencies(
    code: string,
    assetRoot: string
  ): Promise<void> {
    (window as unknown as Record<string, unknown>)['echarts'] = echarts;

    if (/\bmap(?:Type)?\s*:\s*['"]world['"]/.test(code)) {
      await this.loadScript(new URL('vendor/echarts/world.js', assetRoot).href);
    }
    if (/\bmap(?:Type)?\s*:\s*['"]china['"]/.test(code)) {
      await this.loadScript(new URL('vendor/echarts/china.js', assetRoot).href);
    }
    if (/\becStat\b/.test(code)) {
      await this.loadScript(
        new URL('vendor/echarts-stat/dist/ecStat.min.js', assetRoot).href
      );
    }
  }

  private loadScript(source: string): Promise<void> {
    const existing = ApacheEchartsComponent.scriptPromises.get(source);
    if (existing) {
      return existing;
    }

    const promise = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = source;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Unable to load dependency: ${source}`));
      document.head.appendChild(script);
    }).catch((error: unknown) => {
      ApacheEchartsComponent.scriptPromises.delete(source);
      throw error;
    });
    ApacheEchartsComponent.scriptPromises.set(source, promise);
    return promise;
  }

  private createScopedJQuery(): typeof jquery {
    const scoped = ((selector: unknown) =>
      jquery(selector as never, this.chartElement.nativeElement)) as typeof jquery;
    scoped.get = jquery.get.bind(jquery);
    scoped.getJSON = jquery.getJSON.bind(jquery);
    scoped.getScript = jquery.getScript.bind(jquery);
    scoped.when = jquery.when.bind(jquery);
    return scoped;
  }

  private createScopedDocument(): Pick<Document, 'addEventListener' | 'createElement'> {
    return {
      addEventListener: (
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | AddEventListenerOptions
      ): void => {
        document.addEventListener(type, listener, options);
        this.listeners.push({ target: document, type, listener, options });
      },
      createElement: document.createElement.bind(document),
    };
  }

  private createScopedWindow(): Record<string, unknown> {
    return {
      innerWidth: this.chartElement.nativeElement.clientWidth,
      innerHeight: this.chartElement.nativeElement.clientHeight,
      addEventListener: (
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | AddEventListenerOptions
      ): void => {
        window.addEventListener(type, listener, options);
        this.listeners.push({ target: window, type, listener, options });
      },
    };
  }

  private createExampleApp(): ExampleApp {
    const app: ExampleApp = {
      __internalAPI: {
        retrieveViewCoordSysRects: (
          chart: ECharts,
          query: Record<string, unknown>
        ) => {
          const chartWithModel = chart as unknown as {
            getModel: () => {
              queryComponents: (value: Record<string, unknown>) => Array<{
                coordinateSystem?: {
                  getViewRect?: () => { clone: () => unknown };
                  getBoundingRect?: () => {
                    clone: () => { applyTransform: (value: unknown) => void };
                  };
                  getComputedTransform?: () => unknown;
                };
              }>;
            };
          };
          const component = chartWithModel.getModel().queryComponents(query)[0];
          const coordinateSystem = component?.coordinateSystem;
          if (!coordinateSystem?.getViewRect || !coordinateSystem.getBoundingRect) {
            throw new Error('The requested ECharts coordinate system is unavailable.');
          }
          const viewRect = coordinateSystem.getViewRect().clone();
          const contentBoundingRect = coordinateSystem.getBoundingRect().clone();
          const transform = coordinateSystem.getComputedTransform?.();
          if (transform) {
            contentBoundingRect.applyTransform(transform);
          }
          return { viewRect, contentBoundingRect };
        },
      },
    };
    let proxiedApp: ExampleApp;
    proxiedApp = new Proxy(app, {
      set: (target, property, value) => {
        Reflect.set(target, property, value);
        if (property === 'config' || property === 'configParameters') {
          queueMicrotask(() => {
            if (this.app === proxiedApp) {
              this.zone.run(() => {
                this.controls = this.createControls(proxiedApp);
                this.changeDetector.markForCheck();
              });
            }
          });
        }
        return true;
      },
    });
    return proxiedApp;
  }

  private createControls(app: ExampleApp): ExampleControl[] {
    if (!app.config) {
      return [];
    }

    return Object.entries(app.config)
      .filter(([key]) => key !== 'onChange')
      .map(([key, value]) => {
        const parameters = app.configParameters?.[key] ?? {};
        const options = parameters.options
          ? Array.isArray(parameters.options)
            ? parameters.options.map((option) => ({
                label: String(option),
                value: option,
              }))
            : Object.entries(parameters.options).map(([label, option]) => ({
                label,
                value: option,
              }))
          : undefined;
        let kind: ExampleControl['kind'] = 'text';
        if (typeof value === 'function') {
          kind = 'action';
        } else if (options) {
          kind = 'select';
        } else if (typeof value === 'boolean') {
          kind = 'boolean';
        } else if (typeof value === 'number') {
          kind = 'number';
        } else if (typeof value === 'string' && /^#[0-9a-f]{3,8}$/i.test(value)) {
          kind = 'color';
        }
        return {
          key,
          label: key.replace(/([a-z])([A-Z])/g, '$1 $2'),
          kind,
          value,
          min: parameters.min,
          max: parameters.max,
          step: parameters.step,
          options,
        };
      });
  }

  private createTrackedSetTimeout(): typeof window.setTimeout {
    return ((handler: TimerHandler, timeout?: number, ...argumentsList: unknown[]) => {
      const id = window.setTimeout(() => {
        this.timeoutIds.delete(id);
        if (typeof handler === 'function') {
          handler(...argumentsList);
        }
      }, timeout);
      this.timeoutIds.add(id);
      return id;
    }) as typeof window.setTimeout;
  }

  private createTrackedSetInterval(): typeof window.setInterval {
    return ((handler: TimerHandler, timeout?: number, ...argumentsList: unknown[]) => {
      const id = window.setInterval(() => {
        if (typeof handler === 'function') {
          handler(...argumentsList);
        }
      }, timeout);
      this.intervalIds.add(id);
      return id;
    }) as typeof window.setInterval;
  }

  private observeResize(): void {
    this.resizeObserver?.disconnect();
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    this.resizeObserver = new ResizeObserver(() => this.chart?.resize());
    this.resizeObserver.observe(this.chartElement.nativeElement);
  }

  private destroyRuntime(): void {
    this.cleanupInitializer?.();
    this.cleanupInitializer = undefined;
    this.intervalIds.forEach((id) => window.clearInterval(id));
    this.timeoutIds.forEach((id) => window.clearTimeout(id));
    this.intervalIds.clear();
    this.timeoutIds.clear();
    this.listeners.forEach(({ target, type, listener, options }) =>
      target.removeEventListener(type, listener, options)
    );
    this.listeners.length = 0;
    this.app = undefined;
  }

  private disposeChart(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    this.chart?.dispose();
    this.chart = undefined;
  }
}
