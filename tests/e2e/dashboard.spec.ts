import { test, expect } from './helpers/test-fixtures';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';

test.describe('Dashboard Tests', () => {
  test.beforeEach(async ({ page, userCredentials }) => {
    // Register a new user first, since login is required for dashboard access
    const registerPage = new RegisterPage(page);
    const dashboardPage = new DashboardPage(page);

    await registerPage.goTo();
    await registerPage.register(
      userCredentials.name!,
      userCredentials.email,
      userCredentials.password,
      userCredentials.organization!
    );

    // Wait for navigation to projects (dashboard)
    await dashboardPage.waitForURL(/\/projects$/);
  });

  test('should display dashboard with projects', async ({ page }) => {
    // Check that projects page elements are present
    await expect(page.locator('h1', { hasText: 'Proyectos' })).toBeVisible();
    await expect(page.locator('text=Prioriza con confianza')).toBeVisible();
  });

  test('should navigate to projects section', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);

    // Click on projects in sidebar navigation
    await dashboardPage.navigateToProjects();

    // Verify navigation to projects
    await dashboardPage.waitForURL(/\/projects$/);
    await expect(page.locator('h1', { hasText: 'Proyectos' })).toBeVisible();
  });

  test('should navigate to clients section', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);

    // Click on clients in sidebar navigation
    await dashboardPage.navigateToClients();

    // Verify navigation to clients
    await dashboardPage.waitForURL(/\/clients$/);
    await expect(page.locator('h1')).toContainText('Clientes');
  });

  test('should navigate to files section', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);

    // Click on files in sidebar navigation
    await dashboardPage.navigateToFiles();

    // Verify navigation to files
    await dashboardPage.waitForURL(/\/files$/);
    await expect(page.locator('h1')).toContainText('Archivos');
  });
});