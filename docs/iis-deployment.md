# DARP deployment on IIS

## Build and installation

1. Build from the repository root: `npm run build -- --configuration production`.
2. Copy **the contents** of `dist/demo1` into a dedicated IIS website's physical
   directory. `index.html`, `web.config`, JavaScript/CSS bundles and `assets/`
   must sit together in that directory. Node.js is not required on the server.
3. Enable IIS Static Content and Default Document, and install Microsoft's
   [URL Rewrite module](https://learn.microsoft.com/en-us/iis/extensions/url-rewrite-module/using-the-url-rewrite-module).
   Configure a dedicated application pool with **No Managed Code**, enable
   anonymous authentication, and grant its identity read access to the website.
4. Set the website binding (hostname/port and the appropriate HTTPS certificate),
   then open `/auth/login` directly and refresh it. Verify JavaScript, styles,
   logos and fonts load successfully.

The supplied build uses `<base href="/">` and is intended for the **website
root**. For an IIS application under `/darp/`, rebuild with
`npm run build -- --configuration production --base-href /darp/` and separately
verify existing application asset paths under that prefix before deploying.
The supplied root build has not been validated as a subdirectory deployment.
Use a dedicated frontend directory; do not overwrite a .NET backend's
`web.config` with the frontend configuration.

## Local preview and opening index.html

Open this Angular build through an HTTP server, rather than double-clicking
`dist/demo1/index.html`. The root deployment's `<base href="/">` resolves
relative CSS/JS URLs to `file:///C:/...` when opened via `file://` on Windows,
outside the build directory. Those files do not exist at the drive root, so
the application cannot load. Browser module restrictions can also apply to
local-file origins; see MDN's
[local testing server guidance](https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Tools_and_setup/set_up_a_local_testing_server).

For a quick static preview from the repository root, run
`python -m http.server 8188 --bind 127.0.0.1 --directory dist/demo1` and open
`http://127.0.0.1:8188/`. This Python preview does not process `web.config`
or supply the deep-link fallback; use IIS/IIS Express for direct internal-route
navigation and refresh validation. The deployed IIS root build should keep
`<base href="/">`.

## API configuration

The production bundle uses `http://185.81.99.32:758/api`, as configured
in `src/environments/environment.prod.ts`, using the IP/port supplied by the user
on 2026-10-14 and the existing `/api` base path. The user confirmed that the
backend is not built yet, so endpoint availability is **unverified**. This
expects the future API to be available at that address; if its deployment uses
another address, set `apiUrl` accordingly and rebuild. Editing the TypeScript
environment file on IIS after copying
the build does not change the compiled bundle. For an HTTPS frontend, use an
HTTPS API. The backend team must permit the frontend origin in its CORS policy
when the API uses a different origin. No backend routing or reverse proxy is
configured by this frontend package.

## Included IIS behavior

`src/web.config` is copied by the Angular production build. It supplies
`index.html` as the default document, MIME types for JSON/SVG/WebP/WOFF/WOFF2,
and an Angular navigation fallback for GET/HEAD HTML requests to nonexistent
files/directories. API paths, assets and file extensions are excluded, so
missing resources retain their error responses. The HTML entry point is
served with `Cache-Control: no-cache` to revalidate deployment changes.
This follows Angular's
[server fallback requirement](https://angular.dev/tools/cli/deployment)
and Microsoft's
[rewrite configuration reference](https://learn.microsoft.com/en-us/iis/extensions/url-rewrite-module/url-rewrite-module-configuration-reference).

## Troubleshooting HTTP 500 on the target server

On 2026-10-14, the user deployed the frontend to `http://185.81.99.32:759/`.
Remote requests to `/`, `/index.html` and the SVG logo all returned IIS 10's
generic HTTP 500 response. That response does not expose the IIS substatus or
configuration error. The user subsequently supplied the local detailed error:
`500.19`, `0x8007000d`, IIS Web Core, an empty Config Error, and Config Source
lines `-1`/`0` for `C:\inetpub\wwwroot\darp-frontend\web.config`.
Both source and built `web.config` parse successfully as XML and share SHA256
`D122724D7A6E4D42703E38864CCFF3CC6564977DC27F9F3426CE286EE9011B71`.
The deployed copy and installed server modules have not been inspected.
Missing URL Rewrite is the leading hypothesis, rather than a confirmed cause.
The specific cause has **not** been established; changing
the Angular API URL cannot repair a failure serving the HTML/static files.

On the server itself, open `http://localhost:759/index.html` (or use the site's
bound IP if the binding does not accept localhost), and collect `HTTP Error`,
`Error Code`, `Config Error` and the indicated configuration lines. If local
errors are also hidden, use the site's IIS access log to obtain `sc-status`,
`sc-substatus` and `sc-win32-status` and inspect the local IIS configuration.
Avoid exposing detailed errors publicly just to obtain these details.

For `500.19`, follow Microsoft's
[diagnostic reference](https://learn.microsoft.com/en-us/troubleshoot/developer/webapps/iis/site-behavior-performance/http-error-500-19-webpage):

- `0x8007000d` and an unrecognized `rewrite` element: install IIS URL Rewrite
  on the target server. The supplied configuration requires this module; local
  IIS Express had it installed during validation. Verify URL Rewrite appears
  in IIS Manager before retrying.
- `0x80070021`: the indicated configuration section is locked above the site;
  have the administrator configure/delegate that exact section for this site.
- `0x80070005`: inspect filesystem read permissions for the website identity.
- `0x800700b7`: inspect the reported duplicate inherited configuration entry.

For the reported `0x8007000d`, first run this read-only command in elevated
PowerShell **on the target server**:

```powershell
& "$env:windir\System32\inetsrv\appcmd.exe" list modules | Select-String Rewrite
```

If no Rewrite module is reported, install
[Microsoft URL Rewrite 2.1 x64](https://download.microsoft.com/download/1/2/8/128E2E22-C1B9-44A4-BE2A-5859ED1D4592/rewrite_amd64_en-US.msi)
on that server, reopen IIS Manager, verify URL Rewrite appears, and retry the
site and a direct `/auth/login` refresh. Avoid restarting unrelated websites.
If Rewrite is already present or the same error persists, parse the deployed
XML with `[xml](Get-Content 'C:\inetpub\wwwroot\darp-frontend\web.config' -Raw)`
and compare its SHA256 to the built file above before replacing any configuration.

The frontend port is 759. The production API target remains port 758, as supplied
earlier, and must permit frontend origin `http://185.81.99.32:759` when the backend
is implemented. Changing the frontend binding alone does not require a rebuild.

## Validation on 2026-10-14 (Asia/Tehran)

- Final ZIP integrity passed: all **2713** archived files matched the production
  directory byte-for-byte; `index.html` and `web.config` are at the ZIP root.
  An adjacent `.sha256` file records the package checksum.
- Production build and project lint passed. Existing warnings remain: 2.80 MB
  initial bundle exceeds the 2 MB warning budget, and four CSS selectors were
  skipped by optimization. The build's error budget was not exceeded.
- The actual production directory was served by IIS Express 10 with URL Rewrite,
  using an isolated temporary applicationhost configuration. Six root/deep
  paths returned the unchanged HTML entry point with HTTP 200 and `no-cache`.
- All 81 checked local resources (all root JS/CSS bundles, CSS font references,
  HTML asset references and a representative JSON asset) returned HTTP 200 with
  appropriate non-HTML content types. Missing JS/JSON and an API path returned
  HTTP 404; POST to a frontend route did not return the HTML entry point.
- Chrome Headless bootstrapped the production app at `/`, `/auth/login`,
  `/auth/forgot-password`, `/error/404` and `/cm/vibration/time-domain`, and
  refreshed each successfully. Protected paths correctly led to login without
  a session. No uncaught runtime exceptions or failed same-origin responses
  were observed. Login assets loaded; a login screenshot was inspected.
- Full Karma run: **182 passed, 14 failed (196 total)**. Existing `should create`
  specs have incomplete TestBed dependencies (HTTP/router/translation services
  and component imports/declarations). The failed components are DrawerChat,
  Navbar, SidebarLogo, UserDetails, Topbar, Header, UserListing, Toolbar,
  RoleListing, PermissionListing, RoleDetails, Sidebar, Classic and Crud.
  These unrelated specs were not changed in this packaging task. See
  `tmp/iis-validation/tests.log` for the detailed run.
- No authenticated backend operation, production Windows Server instance or
  subdirectory deployment was tested. The ZIP is a verified frontend artifact;
  configured API target is not yet backed by a verified backend deployment.
