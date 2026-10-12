import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ThemeModeModule } from './theme-mode.module';
import { ThemeModeService } from './theme-mode.service';
import { ThemeModeSwitcherComponent } from './theme-mode-switcher.component';

describe('Theme mode switching without navigation', () => {
  let fixture: ComponentFixture<ThemeModeSwitcherComponent>;
  let service: ThemeModeService;
  let originalTheme: string | null;
  let originalName: string | null;
  const keys = ['kt_theme_mode_value', 'kt_theme_mode_menu', 'kt_true_theme_mode_value', 'kt_true_theme_mode_menu'];
  let stored: (string | null)[];
  const choose = (mode: string) => {
    const link = Array.from(fixture.nativeElement.querySelectorAll('.menu-link') as NodeListOf<HTMLAnchorElement>)
      .find(element => element.textContent!.trim() === mode)!;
    link.click(); fixture.detectChanges();
  };

  beforeEach(async () => {
    originalTheme = document.documentElement.getAttribute('data-bs-theme');
    originalName = document.body.getAttribute('data-kt-name');
    stored = keys.map(key => localStorage.getItem(key));
    keys.forEach(key => localStorage.removeItem(key));
    localStorage.setItem(keys[0], 'light'); localStorage.setItem(keys[1], 'light');
    document.documentElement.setAttribute('data-bs-theme', 'light');
    await TestBed.configureTestingModule({ imports: [ThemeModeModule] }).compileComponents();
    service = TestBed.inject(ThemeModeService); service.init();
    fixture = TestBed.createComponent(ThemeModeSwitcherComponent); fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    keys.forEach((key, index) => {
      if (stored[index] === null) { localStorage.removeItem(key); }
      else { localStorage.setItem(key, stored[index]!); }
    });
    if (originalTheme === null) { document.documentElement.removeAttribute('data-bs-theme'); }
    else { document.documentElement.setAttribute('data-bs-theme', originalTheme); }
    if (originalName === null) { document.body.removeAttribute('data-kt-name'); }
    else { document.body.setAttribute('data-kt-name', originalName); }
  });

  it('changes live theme, menu selection and icon while keeping the document and unsaved form intact', () => {
    const page = document.documentElement;
    const url = location.href;
    const draft = document.createElement('input'); draft.value = 'Unsaved draft';
    fixture.nativeElement.appendChild(draft);
    for (const mode of ['Dark', 'Light', 'Dark', 'Light']) {
      choose(mode);
      expect(document.documentElement).toBe(page);
      expect(location.href).toBe(url);
      expect(draft.isConnected).toBeTrue(); expect(draft.value).toBe('Unsaved draft');
      expect(page.getAttribute('data-bs-theme')).toBe(mode.toLowerCase());
      expect(fixture.nativeElement.querySelector('.menu-link.active').textContent.trim()).toBe(mode);
      expect(fixture.nativeElement.querySelector('.btn app-keenicon .ki-' + (mode === 'Dark' ? 'moon' : 'night-day'))).not.toBeNull();
      expect(service.mode.value).toBe(mode.toLowerCase());
      expect(service.menuMode.value).toBe(mode.toLowerCase());
    }
  });

  it('retains the existing saved preference for the next application session', () => {
    choose('Dark');
    expect(localStorage.getItem(keys[0])).toBe('dark');
    expect(localStorage.getItem(keys[1])).toBe('dark');
    const nextSession = new ThemeModeService();
    expect(nextSession.mode.value).toBe('dark'); expect(nextSession.menuMode.value).toBe('dark');
  });

  it('switches both ways after layout initialization adds its Metronic body name', () => {
    document.body.setAttribute('data-kt-name', 'metronic');
    for (const mode of ['Dark', 'Light', 'Dark', 'Light']) {
      choose(mode);
      expect(document.documentElement.getAttribute('data-bs-theme')).toBe(mode.toLowerCase());
    }
  });

  it('uses Metronic image switching without corrupting light images when the same mode is selected again', () => {
    const image = document.createElement('img');
    const light = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"/%3E';
    const dark = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" id="dark"/%3E';
    image.setAttribute('src', light); image.setAttribute('data-kt-img-dark', dark);
    fixture.nativeElement.appendChild(image);
    choose('Dark'); choose('Dark');
    expect(image.getAttribute('src')).toBe(dark);
    expect(image.getAttribute('data-kt-img-light')).toBe(light);
    choose('Light');
    expect(image.getAttribute('src')).toBe(light);
  });
});
