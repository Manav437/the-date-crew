# The Date Crew — Matchmaker Dashboard MVP

An internal-matchmaker assignment demo built against `tdc-tech.pdf`. All profiles are fictional. The application intentionally uses mock email actions, not real delivery.

## Run locally

Use **Node.js 22 or 24 LTS**.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. A development-only signing secret is used when `AUTH_SECRET` is empty. Before a production run or deployment, generate a secret with `openssl rand -hex 32` and set `AUTH_SECRET` to its output. Never commit `.env.local` or reuse the public development fallback.

**Sample login**

- Email: `manav@thedatecrew.com`
- Password: `TdcDemo2026!`

This public demo account is intentional for assignment reviewers. It is **not production authentication**. Signup links explain that this is an internal staff portal rather than collecting a password for a fake registration flow.

## Assignment coverage

| Requirement | Implementation |
| --- | --- |
| Basic matchmaker login | Server-checked demo credentials, signed eight-hour HttpOnly cookie, logout, server-side access checks |
| Assigned customer dashboard | Four assigned clients, search by name/city, journey filter, profile links |
| Complete biodata | All requested fields, including siblings and pets; additional mother tongue, family values, diet, smoking and drinking |
| 100+ opposite-gender profiles | Separate deterministic pool of 240 synthetic profiles: 120 women and 120 men |
| Gender-specific matching | Strict four-condition male eligibility; female scoring for profession, values, children, relocation and lifestyle |
| Explainable scores | Deterministic top-five scoring with factual explanations and stable tie-breaking |
| AI-assisted experience | Server-side OpenAI intro generation, editable before mock send; honest rule-based fallback when unavailable |
| Send Match | Accessible preview dialog, recipient and match details, editable draft, mock-send confirmation and local history |
| Meeting/call notes | Timestamped notes by customer, persisted in this browser |
| Journey tracking | Editable status, reflected in dashboard filters; mock sends record “Introduction Sent” |
| Deliverables | Sample credentials and write-up below; hosted URL and GitHub repository still need to be supplied |

## AI setup and privacy

Set these **server-only** environment variables:

```dotenv
AUTH_SECRET=<random-secret-of-at-least-32-bytes>
OPENAI_API_KEY=<your-key>
OPENAI_MODEL=gpt-4.1-mini
APP_ORIGIN=https://your-deployment.example
```

`OPENAI_API_KEY` is optional for running the template-only demo, but **configure it and verify a real generated introduction before submitting the mandatory AI requirement**. Without it, the UI labels drafts as rule-based and disables AI generation; it does not pretend templates are AI. With it, select a suggested match, click **Generate AI intro**, review/edit the result, and confirm the mock send. Provider failures fall back to the template with an explanatory notice.

The app calls the OpenAI Responses API with `store: false`, a 15-second timeout, and bounded output. Only fictional first names, age, city, profession, and safe alignment facts are sent. Contacts, DOB, income, company, religion, caste and staff identity are excluded. Requests incur provider costs and remain subject to the provider’s data-handling policies; `store: false` is not a promise of zero provider retention. Review generated drafts before recording a mock send.

The endpoint verifies the session, client assignment, request origin, and server-computed suggested match. AI attempts are limited to five per minute per demo account **per process**. This is not a distributed production limiter; set provider budget limits too. Set `APP_ORIGIN` to the exact public origin, without a path or trailing slash, especially behind an HTTPS-terminating reverse proxy. Never use `NEXT_PUBLIC_` for keys or signing secrets.

## Validation

```sh
npm run lint
npm run typecheck
npm run build
```

For a manual walkthrough: log in, search for a client, open their profile, save a note, reload to check persistence, preview an introduction, record a mock send, and log out.

The matching pool is static JSON in `data/match-pool.json`; no generation script is required. Fixture ages are a snapshot as of **2026-10-16**. All pool contacts are fictional `example.com` addresses and non-contactable phone placeholders.

## Submission write-up (three paragraphs)

**Tech choices.** The MVP uses Next.js 16 App Router, React 19, TypeScript, and Tailwind CSS. Server Components authorize access before selecting assigned customer data and computing suggestions; small Client Components handle search, forms, and the preview dialog. Cache Components and Partial Prefetching remain enabled, with Suspense boundaries around request-time work and request-time session-expiry validation. Static JSON is the assignment’s mock data store, while notes, journey updates, and mock introductions use browser-local storage to make the demo usable across reloads without a database service.

**Matching logic.** A reproducible pool contains 120 fictional profiles per gender. For male customers, candidates must satisfy all four explicit brief requirements: younger, lower annual income, shorter height, and matching views on children. Eligible matches receive a base score refined by shared family values, relocation feasibility, and lifestyle. Female-client scores use stated profession, family values, children, relocation feasibility and lifestyle, without assuming employer prestige equals compatibility. Only verified opposite-gender profiles are considered, scores are bounded to 100, and the top five are explained using recorded facts. Gender-specific rules are implemented to satisfy the exercise, not proposed as universal relationship preferences; production matching should use each person’s explicit preferences and consent. Caste, religion and mother tongue are displayed as biodata but are not ranking signals.

**AI and assumptions.** OpenAI optionally turns minimized fictional profile information into a concise personalized introduction for human review; it neither chooses recipients nor sends email. Rule-based drafts remain available if the key is missing, the service fails, or the rate limit is reached, and the UI distinguishes them from real AI output. “Verified” is fixture metadata, not a real identity check. The shared reviewer account, opposite-gender pool, fixed fixture date, browser-local persistence, and mock email actions are explicit MVP assumptions. A production version needs private persistent data, real staff accounts, server-side notes/history, consent-aware sharing, audit trails, distributed rate limits, and provider-budget controls.

## Research informing the additional fields

- [Shaadi.com — search criteria](https://support.shaadi.com/support/solutions/articles/48000953830-how-can-i-search-for-profiles-on-shaadi-com-what-are-the-search-options-available-): location, education/profession, mother tongue and lifestyle are relevant profile context.
- [Shaadi.com — partner preferences in biodata](https://blog.shaadi.com/the-importance-of-partner-preferences-in-a-marriage-biodata/): explicit family values and diet/smoking/drinking preferences help avoid vague compatibility assumptions.
- [Bumble — compatibility and verification features](https://bumble.com/the-buzz/bumble-dating-features): shared goals, values, lifestyle and verification support more intentional review. This demo uses a synthetic verified flag, not identity verification.

These references informed field selection, not validated predictive accuracy. A score is a review aid, not a probability of relationship success.

## Dependency audit note

`npm audit --omit=dev` reports no production vulnerabilities in the validated install. The full audit reports five high-severity entries in the existing ESLint/fast-glob/micromatch/braces development-tool chain. npm proposes a breaking downgrade of `eslint-config-next`, so no forced fix is applied; review the advisory and a compatible upstream patch separately.

## Deployment / submission checklist

1. Push this project to your GitHub repository; do not commit `.env.local`.
2. Import the repository into Vercel (Node runtime; no static export).
3. Configure `AUTH_SECRET`, `OPENAI_API_KEY`, `OPENAI_MODEL`, and the final HTTPS `APP_ORIGIN`; redeploy after setting the final origin.
4. Check login, a real AI-generated intro, notes after reload, mock sends, and logout on the hosted site.
5. Supply the **live hosted URL**, **GitHub repo URL**, sample credentials above, and the three-paragraph write-up. Neither URL is fabricated in this repository.
6. Submit to the assignment email using its required subject line with your own name.

### Known demo limitations

Browser storage is per browser/device, can be edited or cleared by the user, and is shared between tabs of this demo account. It is not a secure/shared operational record and should never hold real customer information. Logout ends the cookie session but does not erase synthetic local demo history. No real emails, signup accounts, identity checks, production data ingestion, or deployment have been implemented. The only external service is optional OpenAI intro generation. Synthetic fixture data is not confidential; replace it and the demo auth design before using this with real customers.
