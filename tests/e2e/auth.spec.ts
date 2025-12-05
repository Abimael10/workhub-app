import { test, expect } from './helpers/test-fixtures';
import { RegisterPage } from './pages/RegisterPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';

test.describe('Authentication Flow', () => {
  test('should allow user registration', async ({ page, userCredentials }) => {
    const registerPage = new RegisterPage(page);
    const dashboardPage = new DashboardPage(page);

    await registerPage.goTo();

    // Register using unique credentials
    await registerPage.register(
      userCredentials.name!,
      userCredentials.email,
      userCredentials.password,
      userCredentials.organization!
    );

    // Verify redirect to projects (default dashboard page)
    await dashboardPage.waitForURL(/\/projects$/);
    await expect(page.locator('h1', { hasText: 'Proyectos' })).toBeVisible();
  });

  test('should allow user login with registered user', async ({ page, userCredentials }) => {
    // First register a user
    const registerPage = new RegisterPage(page);
    const dashboardPage = new DashboardPage(page);
    const loginPage = new LoginPage(page);

    await registerPage.goTo();
    await registerPage.register(
      userCredentials.name!,
      userCredentials.email,
      userCredentials.password,
      userCredentials.organization!
    );

    // Verify registration worked
    await dashboardPage.waitForURL(/\/projects$/);

    // Now log out to test login
    await dashboardPage.logout();
    await loginPage.waitForURL(/\/login$/);

    // Now try to log in with the same user
    await loginPage.login(userCredentials.email, userCredentials.password);

    // Verify successful login - should redirect to projects
    await dashboardPage.waitForURL(/\/projects$/);
    await expect(page.locator('h1', { hasText: 'Proyectos' })).toBeVisible();
  });

  test('should allow user logout after login', async ({ page, userCredentials }) => {
    // First register a user
    const registerPage = new RegisterPage(page);
    const dashboardPage = new DashboardPage(page);
    const loginPage = new LoginPage(page);

    await registerPage.goTo();
    await registerPage.register(
      userCredentials.name!,
      userCredentials.email,
      userCredentials.password,
      userCredentials.organization!
    );

    // Verify registration worked
    await dashboardPage.waitForURL(/\/projects$/);

    // Logout
    await dashboardPage.logout();

    // Verify logout - should redirect to login
    await loginPage.waitForURL(/\/login$/);
    await expect(page.locator('text=Ingresa a tu espacio')).toBeVisible();
  });
});