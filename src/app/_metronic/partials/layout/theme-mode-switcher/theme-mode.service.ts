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

    document.documentElement.setAttribute('data-bs-theme', _mode);
    ThemeModeComponent.init();
  }

  public updateMenuMode(_menuMode: ThemeModeType) {
    this.menuMode.next(_menuMode);
    if (localStorage) {
      localStorage.setItem(themeMenuModeLSKey, _menuMode);
    }
  }

  public init() {
    this.updateMode(this.mode.value);
    this.updateMenuMode(this.menuMode.value);
  }

  public switchMode(_mode: ThemeModeType) {
    if (localStorage) {
      localStorage.setItem(themeModeLSKey, _mode);
      localStorage.setItem(themeMenuModeLSKey, _mode);
    }
    document.location.reload()
  }
}
