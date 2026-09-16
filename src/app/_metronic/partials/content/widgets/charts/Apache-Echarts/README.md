# Apache ECharts integration

`ApacheEchartsComponent` is the reusable host for application charts and the
generated Apache example widgets. It accepts an ECharts `options` object, a
custom `initializer`, or a generated `demoId`:

```html
<app-apache-echarts [options]="chartOptions" height="360px" />
<app-apache-echarts demoId="bar-simple" renderer="svg" />
```

The `/crafted/widgets/apache-charts` gallery exposes 370 examples. Its
cards use `IntersectionObserver`, so chart code and data are fetched only when
a card approaches the viewport. Search and category filters operate on the
generated registry without loading the charts.

## Regenerating the examples

The committed output is pinned to Apache ECharts Examples commit
`aebd221b302308af240b90267fd43b81657099a1`. After checking out that revision
and fetching its referenced assets, run:

```powershell
node tools/generate-apache-echarts.mjs `
  --source-root <echarts-examples>/public/examples/ts `
  --catalog <echarts-examples>/src/data/chart-list-data.js `
  --source-commit aebd221b302308af240b90267fd43b81657099a1 `
  --resource-root <downloaded-assets>/public `
  --world-map <downloaded-world.js> `
  --china-map <downloaded-china.js>
```

Run `npm run verify:apache-echarts` after regeneration. This verifies the
catalog count, generated wrappers, executable scripts, referenced local data,
and vendored dependencies. Run `npm run test:apache-echarts` for the focused
Angular browser tests.

Resources are served from `src/assets/apache-echarts`. The seven examples that
depend on the external Baidu Maps API are intentionally excluded.
