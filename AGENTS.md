# AGENTS.md

This file provides guidance to AI agents when working with code in this repository.

## What This Project Is

MOSIP Pre-Registration UI is an Angular SPA that allows residents to register demographic details, upload supporting documents, and book appointments at registration centers — all before physically visiting a center. It is part of the [MOSIP](https://mosip.io) open-source identity platform.

The UI interacts with a MOSIP backend (pre-registration service, master data, booking service, notification service) via a base URL configured at runtime, not build time.

---

## Commands

All commands run from inside the `pre-registration-ui/` subdirectory (where `package.json` lives):

```bash
cd pre-registration-ui

# Development server (localhost:4200)
npm start                  # ng serve

# Dev server with proxy (for local backend, resolves CORS)
ng serve --proxy-config proxy.conf.json --ssl true

# Production build
ng build --prod --base-href . --output-path dist

# Run unit tests (Karma/Jasmine, Chrome headless)
ng test

# Run a single test file
ng test --include src/app/path/to/file.spec.ts

# Lint
ng lint

# E2E tests (Protractor)
ng e2e

# Bundle size analysis
npm run stats
```

**Node version:** 14.17.3 / npm 6.14.13 (required; Angular 7 does not build cleanly on Node 16+).

**Proxy config** (`proxy.conf.json`): proxies `/proxyapi/*` → `http://localhost:9090/`. Use this when running a local MOSIP backend.

**Production access URL:** `http://localhost:8080/pre-registration-ui/#/eng` (Nginx Docker container).

---

## Architecture

### Runtime Configuration

The app is **not configured at build time**. On startup, `AppConfigService` (registered as an `APP_INITIALIZER`) loads `src/assets/config.json` before Angular bootstraps. This file contains the `BASE_URL` pointing to the MOSIP backend. This means the same build artifact can be deployed to any environment by swapping `config.json`.

`environment.ts` only sets `production: true/false`; the actual API host comes from `config.json`.

### Module Structure

```
src/app/
├── app.module.ts          # Root — imports CoreModule, AuthModule, SharedModule
├── app-routing.module.ts  # Top-level routes
├── app.constants.ts       # All API path segments, config keys, error codes
├── auth/                  # Login (OTP via email/phone), reCAPTCHA, AuthGuard
├── core/                  # Header, footer, about-us, faq, contact, core services
├── shared/                # Material module re-exports, stepper, dialogs, pipes, models
└── feature/               # Lazy-loaded feature modules:
    ├── dashboard/          # Application list, status cards
    ├── demographic/        # Multi-step personal data form (new & edit)
    ├── file-upload/        # Document upload per proof category
    ├── booking/            # Registration center map/search + slot picker
    └── summary/            # Review and submit, PDF download, notifications
```

All feature modules are **lazy-loaded** via `loadChildren`. Routes are language-prefixed: `/:userPreferredLanguage/pre-registration/...`. The language code (e.g., `eng`, `fra`) drives i18n and is preserved in every URL.

### API Layer (`app.constants.ts`)

All API endpoint segments are defined in `APPEND_URL`. All config parameter names are in `CONFIG_KEYS`. All backend error codes are mapped in `ERROR_CODES`. When adding a new API call, add its path here — do not hardcode URLs in services.

API calls are routed through `BASE_URL` from `config.json`, e.g.:
```
{BASE_URL}/preregistration/v1/applications
{BASE_URL}/preregistration/v1/notification/v2/notify
```

### i18n

Translation files live in `src/assets/i18n/<locale>.json` (e.g., `default.json`, `ara.json`, `spa.json`). In production Docker containers, i18n bundles are downloaded from Artifactory and overlaid at startup — the `i18n/` folder in the image is a placeholder. `ngx-translate` handles runtime language switching.

### Authentication Flow

1. Resident enters email/phone → OTP sent via `send_otp` endpoint
2. OTP validated → JWT stored in session
3. `AuthGuardService` (`canActivate`) protects all `/pre-registration/*` routes
4. Token expiry mapped to error code `KER-ATH-401` → redirect to login

### Application Status Codes

`APPLICATION_STATUS_CODES` in `app.constants.ts`:
- `Application_Incomplete` → demographic filled, no appointment
- `Pending_Appointment` → demographic done, appointment not booked
- `Booked` → appointment confirmed
- `Prefetched` / `Expired` / `Cancelled`

These drive dashboard card rendering and allowed actions.

## Key Files to Know

| File | Purpose |
|------|---------|
| `src/assets/config.json` | Runtime config — `BASE_URL` for the MOSIP backend |
| `src/assets/identity-spec.json` | ID schema defining which fields to capture and their validation rules |
| `src/app/app.constants.ts` | All API paths, config keys, error codes, application statuses |
| `src/app/auth/auth.service.ts` | OTP login, token management |
| `src/app/core/services/` | Config loading, data storage, API services |
| `proxy.conf.json` | Local dev proxy to backend |
| `helm/prereg-ui/values.yaml` | Kubernetes deployment config |
