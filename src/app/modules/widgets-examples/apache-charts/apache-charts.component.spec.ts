import { ApacheChartsComponent } from './apache-charts.component';

describe('ApacheChartsComponent catalog', () => {
  it('contains every unique bundled non-Baidu example', () => {
    const component = new ApacheChartsComponent();
    const ids = component.demos.map((demo) => demo.id);

    expect(component.demos.length).toBe(370);
    expect(new Set(ids).size).toBe(370);
    expect(ids.some((id) => id.includes('bmap'))).toBeFalse();
    expect(ids).not.toContain('map-bin');
    expect(ids).not.toContain('map-polygon');
  });

  it('filters examples by search text and category', () => {
    const component = new ApacheChartsComponent();
    component.searchTerm = 'basic bar';
    component.selectedCategory = 'bar';

    expect(component.visibleDemos.some((demo) => demo.id === 'bar-simple')).toBeTrue();
    expect(component.visibleDemos.every((demo) => demo.categories.includes('bar'))).toBeTrue();
  });
});
