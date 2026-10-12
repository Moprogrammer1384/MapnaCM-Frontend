import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ThemeModeComponent } from '../../../kt/layout';

export type ThemeModeType = 'dark' | 'light';

const themeModeLSKey = 'kt_theme_mode_value';
const themeMenuModeLSKey = 'kt_theme_mode_menu';

const getThemeModeFromLocalStorage = (lsKey: string): ThemeModeType => {
  if (!localStorage) {
    return 'light';
  }

  const data = localStorage.getItem(lsKey);
  if (data === 'dark') {
    return 'dark';
  }

  return 'light';
};

@Injectable({
  providedIn: 'root',
})
export class ThemeModeService {
  public mode: BehaviorSubject<ThemeModeType> =
    new BehaviorSubject<ThemeModeType>(
      getThemeModeFromLocalStorage(themeModeLSKey)
    );
  public menuMode: BehaviorSubject<ThemeModeType> =
    new BehaviorSubject<ThemeModeType>(
      getThemeModeFromLocalStorage(themeMenuModeLSKey)
    );

  constructor() {}

  public updateMode(_mode: ThemeModeType) {
    this.mode.next(_mode);
    if (localStorage) {
      localStorage.setItem(themeModeLSKey, _mode);
    }

    // Metronic updates colors and theme images in place; repeat selections are harmless.
    if (document.documentElement.getAttribute('data-bs-theme') !== _mode) {
      ThemeModeComponent.setMode(_mode, this.menuMode.value);
    }
  }

  public updateMenuMode(_menuMode: ThemeModeType) {
    this.menuMode.next(_menuMode);
    if (localStorage) {
      localStorage.setItem(themeMenuModeLSKey, _menuMode);
    }
  }

  public init() {
    ThemeModeComponent.init();
    this.updateMenuMode(this.menuMode.value);
    this.updateMode(this.mode.value);
  }

  public switchMode(_mode: ThemeModeType) {
    this.updateMenuMode(_mode);
    this.updateMode(_mode);
  }
}
