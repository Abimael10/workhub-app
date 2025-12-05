# Testing in Entipedia

This document provides an overview of the testing strategy in Entipedia.

## Test Structure

```
tests/
├── domain/          # Unit tests for domain logic
├── integration/     # Integration tests for server-side functionality
├── e2e/            # End-to-end tests using Playwright
├── helpers/        # Test utilities, fixtures, and helpers
├── mocks/          # Mock implementations for testing
├── setup.ts        # Test setup and configuration
└── README.md       # This file
```

## Running Tests

### Unit and Integration Tests
Run all unit and integration tests using Vitest:

```bash
npm run test
```

To run tests in watch mode:
```bash
npm run test:watch
```

### End-to-End Tests
Run E2E tests using Playwright:

```bash
npm run test:e2e
```

For more detailed commands, see the main README.

## Test Types

### Domain Tests
- Located in `tests/domain/`
- Test pure business logic without external dependencies
- Fast execution with complete isolation
- Cover use cases and business rules

### Integration Tests
- Located in `tests/integration/`
- Test interactions between multiple components
- Often involve database operations
- Test API endpoints and server-side functionality

### E2E Tests
- Located in `tests/e2e/`
- Test complete user workflows from UI to database
- Use Playwright for browser automation
- Ensure application works as a whole

## Test Helpers

### Fixtures and Utilities
- `tests/e2e/helpers/test-fixtures.ts` - Custom Playwright fixtures
- `tests/e2e/helpers/page-objects.ts` - Page object models
- `tests/e2e/helpers/test-utils.ts` - General test utilities
- `tests/e2e/helpers/db-utils.ts` - Database test utilities

## Writing Tests

### Best Practices
- Write tests that are fast, reliable, and maintainable
- Use descriptive test names that explain the expected behavior
- Follow the Arrange-Act-Assert pattern
- Test one thing at a time
- Use page objects for E2E tests to improve maintainability
- Mock external dependencies in unit tests

### Naming Conventions
- Test files: `[description].test.ts` for unit/integration, `[description].spec.ts` for E2E
- Test functions: Use descriptive names starting with "should"
- Page objects: `[PageName]Page` class names