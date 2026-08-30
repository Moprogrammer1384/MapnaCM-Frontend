// #fake-start#
// export { AuthHTTPService } from './fake/auth-fake-http.service'; // Disabled: the real MapnaCM backend is wired up
// #fake-end#

// #real-start#
export { AuthHTTPService } from './auth-http.service'; // MapnaCM backend (Global.API) — /api/Authentication + /api/User
// #real-end#
