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

    // Wait for navigation to projects. Registration + redirect round-trip can
    // exceed the 5s default `toHaveURL` assertion timeout, so use waitForURL
    // (30s default), matching the convention in files.spec.ts
    await page.waitForURL(/\/projects$/);

    // Navigate to profile page - use more specific selectors and handle dropdown properly
    const profileButton = page.locator('button').filter({ has: page.locator('span') }).first();
    await profileButton.click();

    // Wait for dropdown menu to be visible
    await page.locator('a[href="/profile"]').waitFor({ state: 'visible', timeout: 10000 });

    // Activate the profile link via the keyboard. The Radix portaled menu item
    // renders below the viewport on webkit (auto-scroll cannot reposition a
    // viewport-fixed menu), so a coordinate-based click fails with "outside of the
    // viewport". Focusing the menuitem and pressing Enter avoids coordinates.
    const profileLink = page.locator('a[href="/profile"]');
    await profileLink.focus();
    await page.keyboard.press('Enter');
    await page.waitForURL(/\/profile$/);
  });

  test('should display profile page correctly', async ({ page }) => {
    // Verify the profile page elements are present
    // The h1 contains the user's name, not "Perfil" - "Perfil" is in a smaller text element
    await expect(page.locator('p', { hasText: /^Perfil$/ })).toBeVisible();
    await expect(page.locator('h1')).toContainText('testName'); // The h1 contains the user's name
  });

  test('should navigate to organization settings', async ({ page }) => {
    // Click on the organization section
    await page.locator('a[href="/profile#organization"]').click();

    // Verify organization section is accessible
    await expect(page.locator('text=Tu organización')).toBeVisible();
  });
});