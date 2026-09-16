import fs from 'node:fs';
import path from 'node:path';

const workspaceRoot = process.cwd();
const assetRoot = path.join(workspaceRoot, 'src/assets/apache-echarts');
const examplesRoot = path.join(assetRoot, 'examples');
const widgetsRoot = path.join(
  workspaceRoot,
  'src/app/_metronic/partials/content/widgets/charts/Apache-Widgets'
);
const catalog = JSON.parse(
  fs.readFileSync(path.join(examplesRoot, 'catalog.json'), 'utf8')
);

function fail(message) {
  throw new Error(message);
}

if (catalog.length !== 370) {
  fail(`Expected 370 catalog entries, found ${catalog.length}.`);
}

const ids = new Set();
const excludedDemoIds = new Set([
  'effectScatter-bmap',
  'heatmap-bmap',
  'lines-bmap',
  'lines-bmap-bus',
  'lines-bmap-effect',
  'map-bin',
  'map-polygon',
]);
let resourceReferences = 0;
let vendorReferences = 0;

if (fs.existsSync(path.join(assetRoot, 'vendor/echarts/bmap.min.js'))) {
  fail('The excluded Baidu Maps extension is still bundled.');
}

for (const id of excludedDemoIds) {
  if (
    fs.existsSync(path.join(examplesRoot, `${id}.js`)) ||
    fs.existsSync(path.join(widgetsRoot, id))
  ) {
    fail(`Excluded Baidu Maps example is still bundled: ${id}`);
  }
}

for (const demo of catalog) {
  if (excludedDemoIds.has(demo.id) || /bmap/i.test(demo.id)) {
    fail(`Excluded Baidu Maps example in catalog: ${demo.id}`);
  }
  if (ids.has(demo.id)) {
    fail(`Duplicate catalog ID: ${demo.id}`);
  }
  ids.add(demo.id);

  const examplePath = path.join(examplesRoot, `${demo.id}.js`);
  const widgetPath = path.join(
    widgetsRoot,
    ...demo.id.split('/'),
    `${demo.id.split('/').at(-1)}-apache-widget.component.ts`
  );
  if (!fs.existsSync(examplePath)) {
    fail(`Missing generated example: ${demo.id}`);
  }
  if (!fs.existsSync(widgetPath)) {
    fail(`Missing Angular widget: ${demo.id}`);
  }

  const code = fs.readFileSync(examplePath, 'utf8');
  const widget = fs.readFileSync(widgetPath, 'utf8');
  if (/\bBMap\b|\bbmap\s*:|coordinateSystem\s*:\s*['"]bmap['"]|api\.map\.baidu\.com/.test(code)) {
    fail(`Example depends on Baidu Maps: ${demo.id}`);
  }
  if (/Object\.defineProperty\(exports|\brequire\s*\(/.test(code)) {
    fail(`Generated example contains a module runtime reference: ${demo.id}`);
  }
  if (!widget.includes(`readonly demoId = "${demo.id}"`)) {
    fail(`Widget ID mismatch: ${demo.id}`);
  }

  new Function(
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
  );

  for (const match of code.matchAll(/ROOT_PATH\s*\+\s*['"]([^'"]+)/g)) {
    const reference = match[1];
    resourceReferences++;
    if (reference === '/data/asset/data/links-ny/links_ny_') {
      for (let index = 0; index < 32; index++) {
        const chunk = path.join(
          assetRoot,
          'data/asset/data/links-ny',
          `links_ny_${index}.bin`
        );
        if (!fs.existsSync(chunk)) {
          fail(`Missing dynamic dataset chunk: ${chunk}`);
        }
      }
      continue;
    }
    const localResource = path.join(assetRoot, reference.replace(/^\//, ''));
    if (!fs.existsSync(localResource)) {
      fail(`Missing resource for ${demo.id}: ${reference}`);
    }
  }

  for (const match of code.matchAll(/CDN_PATH\s*\+\s*['"]([^'"]+)/g)) {
    vendorReferences++;
    const localVendor = path.join(assetRoot, 'vendor', match[1]);
    if (!fs.existsSync(localVendor)) {
      fail(`Missing vendor resource for ${demo.id}: ${match[1]}`);
    }
  }
}

for (const requiredFile of [
  'LICENSE',
  'NOTICE.md',
  'vendor/echarts-stat/dist/ecStat.min.js',
  'vendor/echarts/china.js',
  'vendor/echarts/world.js',
]) {
  if (!fs.existsSync(path.join(assetRoot, requiredFile))) {
    fail(`Missing required Apache ECharts file: ${requiredFile}`);
  }
}

console.log(
  `Verified ${catalog.length} widgets and scripts, ${resourceReferences} local resource references, and ${vendorReferences} vendor references.`
);
