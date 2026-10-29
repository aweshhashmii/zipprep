ZIPPREP + ZPREP AI — INTEGRATED STATIC PREVIEW
==============================================

WHAT CHANGED
- Added a Zprep AI navigation link and a small Zprep introduction card to index.html.
- Preserved the existing ZipPrep homepage, subject cards, covers, notes pages, reviews integration, contact details and existing payment-related content.
- Added zprep.html (dashboard), zprep-chat.html (AI tutor frontend preview), mock-test.html / mock-test.js / mock-test.css, and current-affairs.html.
- Included Supabase schema and an Edge Function starter under supabase/.

IMPORTANT CURRENT LIMITATIONS
- The AI tutor is a frontend preview; it does not yet return real AI answers.
- Current-affairs cards are placeholders, not live or verified daily news.
- Mock-test questions are demo questions and must not be advertised as verified official PYQs.
- User sign-in, server-enforced free limits, paid entitlements, payment checkout/verification and automatic premium activation are not configured.
- Do not add an AI API key to HTML or JavaScript. Keep provider secrets in server-side function secrets.
- Review the Supabase SQL and Edge Function, configure authentication and row-level security, then test thoroughly before launch.

HOW TO TEST LOCALLY
1. Extract this ZIP.
2. Open index.html in a browser. The new Zprep link/card should open zprep.html.
3. From the dashboard, open Ask Zprep, Mock Tests, and Daily Current Affairs.
4. Preview labels intentionally explain which parts are not yet live.

HOW TO DEPLOY TO GITHUB PAGES
1. Keep a backup of the current repository first.
2. Extract this ZIP and upload/replace the files in the repository root (the same folder as index.html), including all existing assets.
3. Commit the changes and allow GitHub Pages to rebuild.
4. Test the homepage, all existing notes/PYQ pages, reviews, and payment links on the live site.

BACKEND NEXT STEPS
1. Choose the AI provider and store its API key as a server-side secret.
2. Deploy a server-side function that authenticates the user, checks daily quota, calls the AI provider and increments usage atomically.
3. Configure Supabase Auth, RLS policies and abuse/spend limits.
4. Build a sourced current-affairs editorial pipeline with timestamps, original source links and corrections workflow.
5. Select a payment provider, verify payments server-side, and only then grant a dated premium entitlement.
6. Publish privacy/terms and define prices, quotas, expiry, refund policy and support process.

This ZIP is an integrated frontend preview, not a production-ready live AI service. No changes have been pushed to GitHub or deployed automatically.
