import { test, expect } from './helpers/test-fixtures';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';

// This test file is designed to clean up any test accounts that were created during testing
// It ensures that test data doesn't accumulate in the database

test.describe('Account Cleanup Tests', () => {
  test('should successfully delete a test account', async ({ page, userCredentials, auth }) => {
    // Register a new user first to have an account to delete
    const registerPage = new RegisterPage(page);
    const dashboardPage = new DashboardPage(page);

    await registerPage.goTo();
    await registerPage.register(
      userCredentials.name!,
      userCredentials.email,
      userCredentials.password,
      userCredentials.organization!
    );

    // Verify registration worked
    await dashboardPage.waitForURL(/\/projects$/);
    await expect(page.locator('h1', { hasText: 'Proyectos' })).toBeVisible();

    // Now attempt to delete the account using the auth fixture
    await auth.deleteAccount(userCredentials);

    // Verify that we're redirected to login after account deletion
    await expect(page).toHaveURL(/\/login$/);
  });
});