import { test, expect } from './helpers/test-fixtures';
import { RegisterPage } from './pages/RegisterPage';

test.describe('Profile and Organization Management', () => {
  test.beforeEach(async ({ page, userCredentials }) => {
    // Register a new user first, since login is required for profile management
    const registerPage = new RegisterPage(page);

    await registerPage.goTo();
    await registerPage.register(
      userCredentials.name!,
      userCredentials.email,
      userCredentials.password,
      userCredentials.organization!
    );

    // Wait for navigation to projects
    await expect(page).toHaveURL(/\/projects$/);

    // Navigate to profile page - use more specific selectors and handle dropdown properly
    const profileButton = page.locator('button').filter({ has: page.locator('span') }).first();
    await profileButton.click();

    // Wait for dropdown menu to be visible
    await page.locator('a[href="/profile"]').waitFor({ state: 'visible', timeout: 10000 });

    // Scroll the profile link into view and click
    const profileLink = page.locator('a[href="/profile"]');
    await profileLink.scrollIntoViewIfNeeded();
    await profileLink.click();
    await expect(page).toHaveURL(/\/profile$/);
  });

  test('should display profile page correctly', async ({ page }) => {
    // Verify the profile page elements are present
    // The h1 contains the user's name, not "Perfil" - "Perfil" is in a smaller text element
    await expect(page.locator('text=Perfil')).toBeVisible();
    await expect(page.locator('h1')).toContainText('testName'); // The h1 contains the user's name
  });

  test('should navigate to organization settings', async ({ page }) => {
    // Click on the organization section
    await page.locator('a[href="/profile#organization"]').click();

    // Verify organization section is accessible
    await expect(page.locator('text=Tu organización')).toBeVisible();
  });
});