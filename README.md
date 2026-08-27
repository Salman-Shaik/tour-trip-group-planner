# Roamly — Collaborative Trip Planner

Roamly gives groups one visual place to collect accommodation links, compare stays, vote, discuss trade-offs, and choose a winner. It is a Next.js monolith: the App Router handles both UI and server-side application logic.

## Stack

- Next.js App Router, React, TypeScript, and Tailwind CSS
- Typed local JSON storage for the MVP
- Zod validation for server actions beginning in Phase 2
- Server Components by default

## Prerequisites

- Node.js 22.6 or newer
- npm

## Local setup

```bash
npm install
cp .env.example .env
npm run db:seed
npm run dev
```

On Windows PowerShell use `Copy-Item .env.example .env`. Open [http://localhost:3000](http://localhost:3000). The seed creates a fictional Goa trip with four stays, four participants, votes, comments, amenities, and preferences.

## Google creator login

Create a Google OAuth Web application, add `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI, then fill in `AUTH_SECRET`, `AUTH_GOOGLE_ID`, and `AUTH_GOOGLE_SECRET` from `.env.example`. Generate a strong secret with `npx auth secret`. Never commit `.env`.

Google login is required for creators making new trips. Participants still join a shared trip with only their name. Development seed access remains available through the “Open as creator” card.

## Data and quality commands

```bash
npm run db:seed
npm run lint
npm run typecheck
npm run build
npm run test:unit
npm run test:e2e
```

The seed command recreates `data/db.json` with a complete fictional trip. Server-side reads and atomic queued writes live in `lib/db.ts`. Phase 2 mutations will enforce unique participant/listing votes and the other relational rules represented by the typed document.

For a fresh single-server deployment, `npm start` automatically runs `npm run db:init`. This creates `data/db.json` and its folder only when missing and never overwrites existing data. Use a persistent writable volume for `data/`; JSON storage is not suitable for serverless or multi-instance deployment.

JSON storage is intended for local development and a single Node.js process. It is not safe for serverless or multi-instance production deployment; the data types and repository boundary make a later database migration straightforward.

To run an optimized local build, use `npm run build` and `npm start`.

## Single-instance production deployment

Roamly supports production on one Node.js process with a persistent writable `data/` directory. It must not be deployed to serverless functions or scaled to multiple replicas while using JSON storage.

Set these production variables in the host or `.env`:

```env
AUTH_SECRET=<at least 32 random characters>
AUTH_GOOGLE_ID=<Google OAuth client ID>
AUTH_GOOGLE_SECRET=<Google OAuth client secret>
AUTH_URL=https://your-domain.example
AUTH_TRUST_HOST=true
```

On first startup outside Docker, you can optionally initialize from a downloaded Roamly JSON backup:

```env
ROAMLY_DB_IMPORT_PATH=/absolute/path/to/roamly-backup.json
```

If no import file is supplied, startup creates the default empty database template. If `data/db.json` already exists, startup never imports or overwrites anything. Remove `ROAMLY_DB_IMPORT_PATH` after the first successful import.

For Docker Compose, host paths are not visible inside the container. Put the backup in the repository's ignored `imports/` directory, configure the container path, and then start Compose:

```bash
cp /path/to/roamly-backup.json imports/initial.json
```

```env
ROAMLY_DB_IMPORT_PATH=/imports/initial.json
```

Compose mounts `./imports` read-only at `/imports`. Import occurs only when the persistent `roamly-data` volume does not already contain `db.json`.

Creators can download a trip backup from **Trip Settings → Backup**. The file contains participant and account-related data and must be handled as private data.

Run directly after building:

```bash
npm ci
npm run build
npm start
```

Or deploy the container with a persistent named volume:

```bash
docker compose up --build -d
```

The health endpoint is `/api/health`. Back up the persistent `data/db.json` file regularly and test restoration before relying on backups. A managed host must attach persistent storage at `/app/data` when using the production container. On Railway, create a Railway Volume and set its mount path to `/app/data`; the Dockerfile intentionally does not declare `VOLUME` because Railway manages persistent volumes through the service configuration.

## Firebase App Hosting and Firestore deployment

Firebase App Hosting is the recommended Firebase deployment target for this server-rendered Next.js application. The application uses Application Default Credentials in the Google runtime and stores each entity as its own document under `roamly_internal/database/*`. JSON remains the default for local development and remains the backup/migration format.

1. Create a Firebase project and enable **Cloud Firestore in Native mode**. Pick a region close to your users and, where Firebase permits it, align it with the App Hosting region.
2. Upgrade the project to **Blaze** and create an App Hosting backend connected to this GitHub repository and deployment branch.
3. Create the three secrets referenced by `apphosting.yaml`:

```bash
npx firebase-tools login
npx firebase-tools apphosting:secrets:set roamlyAuthSecret --project YOUR_FIREBASE_PROJECT_ID
npx firebase-tools apphosting:secrets:set roamlyGoogleClientId --project YOUR_FIREBASE_PROJECT_ID
npx firebase-tools apphosting:secrets:set roamlyGoogleClientSecret --project YOUR_FIREBASE_PROJECT_ID
```

4. In **App Hosting → backend → Settings → Environment**, add `AUTH_URL=https://YOUR_APP_HOSTING_DOMAIN`. The committed `apphosting.yaml` already selects Firestore, trusts the hosting proxy, and scales down to zero when idle.
5. Deploy the server-only Firestore rules once from a trusted machine:

```bash
npx firebase-tools deploy --only firestore --project YOUR_FIREBASE_PROJECT_ID
```

6. In Google Cloud OAuth, add the exact production redirect URI `https://YOUR_APP_HOSTING_DOMAIN/api/auth/callback/google` and the matching JavaScript origin.

Once connected, App Hosting builds and deploys pushes to the selected live branch. Do not add Firebase service-account JSON to GitHub or App Hosting; Application Default Credentials are supplied to the runtime.

### Move the existing JSON data

Before cutover, download the current production JSON backup and migrate it once from a trusted machine authenticated with Google Cloud:

```bash
ROAMLY_DB_BACKEND=firestore GOOGLE_CLOUD_PROJECT=your-project npm run db:migrate:firestore -- /path/to/backup.json --confirm
```

The migration deliberately requires `--confirm` because it replaces the destination Firestore dataset. Retain the source backup until the new deployment has been verified.

The migration now creates separate collections for users, trips, participants, listings, votes, comments, amenities, and preferences rather than storing the whole JSON database in one Firestore document. This avoids Firestore's per-document size limit. The adapter can still read the earlier single-document layout, allowing a controlled migration.

### Cost

Firebase App Hosting is **not guaranteed to be completely free**. It requires the pay-as-you-go Blaze plan and a billing account. Small usage can remain within the included App Hosting, Cloud Run, build, bandwidth, and Firestore allowances, but usage beyond those allowances is billed. Configure a Google Cloud budget, billing alerts, and a Cloud Run spend cap before launch. `minInstances: 0` and `maxInstances: 2` in `apphosting.yaml` reduce idle cost and limit accidental scaling.

Firestore itself includes daily no-cost quotas (subject to the current Firebase pricing terms), but reads and writes beyond those quotas are billed on Blaze. This adapter currently loads the trip data collections for each server operation to preserve the existing application behavior; it is appropriate for the current small-group MVP, but high traffic should move to query-specific repositories before scale.

Firebase Analytics is enabled only after a visitor accepts the in-app analytics prompt. Add the seven `NEXT_PUBLIC_FIREBASE_*` values listed in `.env.example` to **App Hosting → backend → Settings → Environment** with build availability, using the web-app configuration shown in Firebase Project Settings. They are public browser identifiers, but keeping project-specific values out of Git avoids secret-scanner alerts and makes environments independently configurable. No Firebase administrator credential is sent to the browser. Roamly records page views only and does not send trip details, votes, participant names, or listing data as custom analytics events. Visitors can reopen **Analytics settings** from the lower-left corner.

## Cloud Run deployment

The existing Docker and Cloud Run deployment remains supported. Set `ROAMLY_DB_BACKEND=firestore`; the same collection-based adapter and Application Default Credentials are used.

The Cloud Run deployment workflow uses GitHub OpenID Connect instead of a long-lived service-account key. Configure these GitHub repository variables:

- `GCP_PROJECT_ID`
- `GCP_REGION`
- `GCP_CLOUD_RUN_SERVICE`
- `GCP_ARTIFACT_REPOSITORY`

Configure `GCP_WORKLOAD_IDENTITY_PROVIDER` and `GCP_DEPLOY_SERVICE_ACCOUNT` as GitHub environment secrets. Store `AUTH_SECRET`, `AUTH_GOOGLE_ID`, and `AUTH_GOOGLE_SECRET` in Google Secret Manager and attach them to the Cloud Run service. After the first deployment, update `AUTH_URL` and the exact Google OAuth callback URI to the Cloud Run domain.

## Delivery status

Phases 1–5 are complete. The app includes the responsive visual foundation, typed JSON data layer, validated trip creation, secure creator and participant cookies, shareable trip dashboards, creator-only accommodation management, passwordless participant joining, immediate voting, property discussions, side-by-side comparison, personal preferences, weighted recommendations, and final stay selection.

Stay details are entered manually, with local platform detection, dropdowns, datalist suggestions, and quick-pick chips reducing repetitive typing. Amenities and personal property tags both accept defaults or custom values. Tags such as “Easy travel”, “Hard travel”, “Far”, “Too close”, “Cheap”, “Comfy”, and “Expensive” appear directly on shortlist cards.

The seeded trip is available at `/trip/goa-december-x7k29`; a new browser is sent to its join screen before entering the shortlist. Create a new trip through `/trips/new` to receive creator controls on that device. Every participant can vote, comment, compare 2–4 stays, and set the importance of price, location, space, rating, and amenities. Recommendations are 75% vote score and 25% group preference fit when preferences exist. Only the creator can select or change the final stay; all alternatives, votes, and comments remain available. A persistent global switch supports light and dark themes.
