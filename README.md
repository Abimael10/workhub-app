## Requirements

- Node.js v18+
- npm v8+
- Docker and Docker Compose
- Git

## Installation

```bash
git clone <repo>
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

3. Configure database:
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
npm run test:e2e   # Automated E2E tests (auth + basic dashboard validation)
npm run lint       # Lint codebase
npm run db:push    # Apply database schema
```

## E2E Tests

```bash
npm run test:e2e                    # Run all tests
npx playwright test --headed        # Visible browser mode
npx playwright test --ui            # Playwright UI runner
```

## Considerations

- Because this was built under time constraints, you may find some partial patterns that weren’t fully refactored. Functionality was prioritized over optimization.
