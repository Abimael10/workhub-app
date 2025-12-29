## Requirements

- Node.js v20+
- npm 9+
- Docker and Docker Compose

## Installation

```bash
git clone https://github.com/Abimael10/workhub-app.git
cd workhub-app
cp .env.example.local .env.local
npm install
```

## Running Locally

1. Start services:
```bash
docker compose -f docker-compose.local.yml up -d db minio minio-setup redis web
# Or use: make dev-up
```

2. Stop services:
```bash
make dev-down
```

3. Configure database (`Note`: make sure to run this once for your environment, otherwise you will not be able to register to continue exploring the application):
```bash
npm run db:push
```

4. Start the app (`NOTE`: not needed if the `web` image is already running):
```bash
npm run dev    # http://localhost:3000
```

5. Create an account at http://localhost:3000/register

## Features

- **Multi-tenant organizations:** Data isolation per organization. Users can belong to an organization, invite existing users, and members/admins can update org projects, clients, and files.

- **Multi-organization switching:** A user can belong to multiple orgs and switch from their profile with one click to manage projects, clients, and files for that org.

- **Kanban board:** Visual project management with drag and drop for status changes. Members, admins, and owners can manage org projects.

- **Client management:** Register and manage clients shared across an organization.

- **File storage:** Upload and manage files shared by org users.

- **Authentication:** NextAuth.js for registration and login.

## Commands

```bash
npm run dev        # Development server
npm run build      # Build for production
npm run start      # Start production server
npm run test       # Unit/integration tests
npm run test:e2e   # Automated E2E tests (some tests are running correctly, needed to refactor some as a TODO)
npm run lint       # Lint codebase
npm run db:push    # Apply database schema
```

## E2E Tests

```bash
npm run test:e2e                    # Run all tests
npx playwright test --headed        # Visible browser mode
npx playwright test --ui            # Playwright UI runner
```

## Schema Notes

- Drizzle schema lives in `src/server/db/schema` and generates SQL under `drizzle/`.
- The `accounts` table comes from NextAuth to support optional OAuth/OIDC providers; with email/password-only flows it stays empty. Token columns are plain `text` fields—add encryption/rotation if enabling external providers.
- Apply schema changes with `npm run db:push` after updating the Drizzle models; review generated SQL before committing.

## Considerations

- Because this was built under time constraints, you may find some partial patterns that weren’t fully refactored. Functionality was prioritized over optimization.

## Build Notes

When building the application, ensure that `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` environment variables are set to valid URLs, otherwise the build will fail during page data collection.
