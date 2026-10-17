# The Date Crew

A matchmaker dashboard built for the TDC assignment.

[Live demo](https://the-date-crew-chi.vercel.app)

## Demo login

- Email: `manav@thedatecrew.com`
- Password: `TdcDemo2026!`

## Setup

Use Node.js 22 or 24.

```sh
npm ci
```

Create `.env.local` with:

```env
AUTH_SECRET=
GROQ_API_KEY=
GROQ_MODEL=openai/gpt-oss-20b
APP_ORIGIN=http://localhost:3000
```

Generate a signing secret with `openssl rand -hex 32` and use the output for `AUTH_SECRET`. Add your Groq API key, then start the app:

```sh
npm run dev
```

Open http://localhost:3000. For deployment, add the same variables in Vercel and set `APP_ORIGIN` to the hosted URL without a trailing slash. Keep `.env.local` out of Git.

## Features

- Customer list with search and journey-status filtering
- Full customer biodata and top five suggested matches
- Compatibility scores with explanations
- AI-generated introduction drafts that can be reviewed and edited
- Mock send action with introduction history
- Session notes saved per customer

The dashboard shows four customers assigned to the demo matchmaker. The separate matching pool contains 240 fictional profiles: 120 men and 120 women.

## Implementation

Built with Next.js, React, TypeScript, and Tailwind CSS. Profile data is stored in static JSON. The demo login checks credentials on the server and uses a signed session cookie to protect dashboard access.

Matching follows the assignment's gender-specific rules. For male customers, candidates must be younger, earn less, be shorter, and have the same preference about children. Female customers are matched using profession, family values, relocation, children, and lifestyle. Eligible candidates are scored and the top five are shown with explanations. Caste and religion are not used for ranking.

Groq generates personalized introduction drafts using a small fictional profile summary. The default model is `openai/gpt-oss-20b`, hosted by Groq. If generation fails, a clearly labelled template is available instead. All data is fictional, emails are mocked, and notes and send history are stored only in the current browser. This is an assignment demo, not a production customer-management system.

## Checks

```sh
npm run lint
npm run typecheck
npm run build
```
