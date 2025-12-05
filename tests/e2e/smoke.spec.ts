import { test, expect } from './helpers/test-fixtures';
import { RegisterPage } from './pages/RegisterPage';

test.describe('Smoke Tests', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Entipedia/);
    // The homepage shows login form in the auth layout, so check if login elements are visible
    await expect(page.locator('text=Ingresa a tu espacio')).toBeVisible();
  });

  test('navigation works after registration and login', async ({ page, userCredentials }) => {
    const registerPage = new RegisterPage(page);

    // First register a new user
    await registerPage.goTo();
    await registerPage.register(
      userCredentials.name!,
      userCredentials.email,
      userCredentials.password,
      userCredentials.organization!
    );

    // Verify successful registration - should redirect to projects
    await expect(page).toHaveURL(/\/projects$/);
    await expect(page.locator('h1', { hasText: 'Proyectos' })).toBeVisible();

    // Test navigation to various pages using sidebar
    await page.locator('a[href="/clients"]').click();
    await expect(page).toHaveURL(/\/clients$/);

    await page.locator('a[href="/files"]').click();
    await expect(page).toHaveURL(/\/files$/);

    // Use more specific selector for projects link to avoid the logo link
    await page.locator('a[href="/projects"]').nth(1).click();
    await expect(page).toHaveURL(/\/projects$/);
  });
});