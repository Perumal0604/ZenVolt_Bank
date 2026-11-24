# ZenVolt Bank — enhanced portal UI preview

React 19 + Vite 7 + Material UI 7 frontend for **P817 — ZenVolt Bank**, IFSC **XBNK0383505**.

This delivery adds the Admin workspace, Customer workspace and KYC registration/review screens as an interactive **frontend preview**. It deliberately does not claim that those workflows are connected to Firebase or persisted. The Firebase/backend phase comes next, after the UI is reviewed and approved.

## Existing live banking integration preserved

The existing Cloudflare Worker integration remains in place and the existing request contract has not been changed:

- `POST /api/v1/banks/P817/sign-in` — bank sign-in
- `GET /api/v1/banks/P817/dashboard` — account and transfer dashboard
- `POST /api/v1/banks/P817/transfers` — transfer request
- `GET /api/v1/directory/banks` — read-only shared bank directory

The existing bearer-token handling, HTTPS endpoint validation, request timeout and `Idempotency-Key` transfer header are retained. Existing live sign-in, account dashboard, transfer submission and transfer history continue to use the Worker API.

## What's new in this UI preview

### Admin portal
- Separate admin workspace preview with its own navigation.
- Operations overview cards and bank-health indicators.
- KYC queue with search, applicant details and document-name list.
- Interactive approve / hold / reject preview decisions and review notes.
- Customer directory, account overview, loan request review, transactions and audit-trail screens.

### Customer portal
- Separate customer workspace preview.
- Account overview, available/posted/held balance presentation and recent activity.
- Transfers screen, saved beneficiaries, transaction history, loans and profile pages.
- Quick-action navigation and responsive layout.

### Customer registration / KYC
- Multi-step personal-details and KYC document selection UI.
- Required identity, address, PAN and profile-photo document selection.
- Pending-approval confirmation screen.

## Important preview limitations

The Admin and Customer preview screens use clearly labelled sample records and temporary in-memory state. KYC review decisions, customer registration, selected files, loan actions, beneficiary actions and transfer preview actions are **not saved** to Firestore, Firebase Storage, the Worker or the shared database. Sample balances and customer details are illustrative and are not real account data. Do not upload real identity documents or enter real customer secrets into this preview.

No new Firebase configuration, Firestore schema, Storage rules, Cloud Functions, admin credentials or central API endpoints have been invented. Those must be implemented in the next backend phase using the actual bank-owned Firebase project and documented contracts. The central/shared directory remains read-only and the existing Worker API is not modified.

## Requirements

- Node.js 22 or newer
- npm 10 or newer
- Access to the existing bank Worker and a valid bank test account for the live banking section

## Setup

```bash
npm ci
```

Copy the environment example on Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

The optional `VITE_X42_API_URL` value overrides the Worker origin. Leave it blank to use `src/cloudflare-config.js`. Set it only to the existing Worker HTTPS origin (no path or query string).

## Run locally

```bash
npm run dev
```

Open the localhost URL printed by Vite (normally `http://localhost:5173`). From the login screen you can choose:

- **Sign in securely** — existing live Worker authentication.
- **Open a new account** — KYC registration UI preview.
- **Customer portal preview** — customer-side UI preview.
- **Admin portal preview** — admin-side UI preview.

The preview links are for design and workflow review only; they are not an authentication or authorization boundary.

## Build and preview

```bash
npm run build
npm run preview
```

## Project structure

```text
src/
  LiveBank.jsx          Existing live Worker login, dashboard and transfer UI
  PortalPreview.jsx     Admin, Customer and KYC registration UI previews
  live-api.js           Existing Worker API client; contract preserved
  cloudflare-config.js  Existing default Worker origin
  bank-config.js        Bank ID, name, IFSC and brand configuration
  amount.js             INR-to-paise input conversion
  main.jsx              React entry point and Material UI theme
  style.css             Shared base layout styles
  live.css              Existing and enhanced responsive portal styles
```

## Next implementation phase: Firebase/backend

After UI approval, connect these screens to the bank-owned backend:

1. Firebase Authentication and trusted admin role assignment.
2. Registration records and private Firebase Storage uploads with security rules.
3. Server-side KYC decisions, audit logging, account creation and one-time opening credit.
4. Customer ownership checks, account/ledger reads, beneficiaries and transaction history.
5. Secure loan workflows and notifications.
6. Emulator tests for authorization, KYC duplicate prevention and money movement.

All authoritative balance and ledger changes must happen in trusted backend code. Never write them directly from React. Never change the shared/central database, its schemas, rules, records or API implementation.

## Deployment

The existing GitHub Actions workflow is retained. Review the Worker origin and deployment settings before pushing to GitHub. Do not commit `.env.local`, service-account files, passwords, private keys or other credentials.
