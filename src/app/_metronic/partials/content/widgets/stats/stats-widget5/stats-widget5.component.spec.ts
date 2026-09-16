import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { StatsWidget5Component } from './stats-widget5.component';
import { SharedModule } from '../../../../../shared/shared.module';

describe('StatsWidget5Component icon', () => {
  let fixture: ComponentFixture<StatsWidget5Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule, SharedModule],
      declarations: [StatsWidget5Component],
    }).compileComponents();
    fixture = TestBed.createComponent(StatsWidget5Component);
  });

  it('renders the keenicon glyph with the colour class', () => {
    fixture.componentInstance.icon = 'basket';
    fixture.componentInstance.iconColor = 'white';
    fixture.detectChanges();
    const icon: HTMLElement = fixture.nativeElement.querySelector('.ki-duotone');
    expect(icon).withContext('keenicon span rendered').toBeTruthy();
    expect(icon.className).toContain('ki-basket');
    expect(icon.className).toContain('fs-3x');
    expect(icon.className).toContain('text-white');
    expect(icon.querySelectorAll('span').length).toBe(4);
  });
});
