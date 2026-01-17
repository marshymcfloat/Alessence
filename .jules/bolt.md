## 2025-01-17 - Isolating Components for Frontend Verification
**Learning:** When full E2E testing is blocked by missing backend/database/auth configuration, creating a temporary test page (e.g. `/test-card`) and using Next.js middleware bypass (if needed) allows for reliable visual verification of component refactors using Playwright.
**Action:** For UI refactors in complex apps, prefer creating a dedicated test route to isolate the component under test, bypassing the need for a full login flow during development verification.
