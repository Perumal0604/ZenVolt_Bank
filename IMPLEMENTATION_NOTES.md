# Implementation notes

## Preserved integration

The existing Worker API module and its request/response usage were not changed. Existing live sign-in, dashboard, transfer submission and read-only shared directory calls remain in `src/LiveBank.jsx` and `src/live-api.js`.

## Added UI preview

`src/PortalPreview.jsx` contains the Admin portal, Customer portal and KYC registration experiences. These are intentionally frontend-only previews. Sample customer records, account balances, transaction rows, loans and document names are illustrative. Approve/hold/reject and other preview interactions update only React component state and are lost when the preview is closed or reloaded.

The login page links to the Admin and Customer preview screens for design review. These links do not provide real authentication, role authorization or production access control. Do not deploy the preview as a real banking workflow until the backend phase implements server-side authorization and persistence.

## Safety boundaries

- No shared/central database collection, schema, rule, record or endpoint was modified.
- The shared bank directory remains read-only through the existing `GET /api/v1/directory/banks` call.
- No direct browser-side balance or ledger writes were introduced.
- No Firebase configuration or backend endpoint was invented.
- No credentials or service-account files are included.

## Verification status

- JSX parsing passed for `src/LiveBank.jsx`, `src/PortalPreview.jsx` and `src/main.jsx` using the installed Babel parser.
- All referenced Lucide icon exports in `PortalPreview.jsx` were confirmed present in the installed package.
- Full Vite production build could not be run in this environment: the supplied archived `node_modules` lacks the platform-specific `@rollup/rollup-linux-x64-gnu` optional package, and package installation timed out. Run `npm ci` and `npm run build` on the development machine.
