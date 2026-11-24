# Changelog

## Enhanced UI preview — 2026-11-24

- Added a separate Admin workspace preview with overview, KYC review, customer directory, accounts, loan requests, transactions and audit-trail screens.
- Added applicant detail dialog with document-name list and interactive approve/hold/reject preview decisions.
- Added a separate Customer workspace preview with account overview, transfers, beneficiaries, transaction history, loans and profile screens.
- Added multi-step customer registration and KYC document-selection preview with pending-approval confirmation.
- Added navigation entry points from the existing login screen for registration and both portal previews.
- Added responsive styles for the new portal workspaces.
- Preserved the existing Worker API client, endpoint paths, authentication flow, dashboard data mapping, transfer payload and idempotency header.
- No Firebase or shared database writes were added. New portal workflows are explicitly labelled as temporary preview state pending backend integration.

## Previous UI enhancement

- Refreshed the existing login and live account dashboard styling.
- Added account summary cards, read-only shared bank directory display and transfer activity filtering.
- Preserved bank identity P817 / ZenVolt Bank / XBNK0383505 and the existing Worker integration.
