/* eslint-disable react-hooks/rules-of-hooks */
import { test as base, expect, Page } from '@playwright/test';
import { DatabaseTestUtils } from './db-utils';
import { TestUserUtils } from '../pages/TestUserUtils';

// Define user credentials type
export type UserCredentials = {
  email: string;
  password: string;
  name?: string;
  organization?: string;
};

// Define test fixtures
export const test = base.extend<{
  loginPage: Page;
  auth: {
    login: (credentials: UserCredentials) => Promise<void>;
    logout: () => Promise<void>;
    register: (credentials: UserCredentials) => Promise<void>;
    deleteAccount: (credentials: UserCredentials) => Promise<void>;
  };
  dbUtils: DatabaseTestUtils;
  userCredentials: UserCredentials;
}>({
  // Add login page fixture
  loginPage: async ({ page }, use) => {
    await page.goto('/login');
    await use(page);
  },

  // Add authentication fixture - this will be simplified since we're updating tests to handle login directly
  auth: async ({ page }, use) => {
    const auth = {
      login: async (credentials: UserCredentials) => {
        await page.goto('/login');
        await page.locator('input[name="email"]').fill(credentials.email);
        await page.locator('input[name="password"]').fill(credentials.password);
        await page.locator('form button').click();

        // Wait for navigation to projects (dashboard equivalent)
        await page.waitForURL('**/projects');
      },

      logout: async () => {
        // Click on user profile dropdown - use a more general selector
        const profileButton = page.locator('button').filter({ has: page.locator('span') }).first();
        await profileButton.click();

        // Click logout option with better visibility and interaction handling
        const logoutOption = page.locator('span', { hasText: 'Cerrar sesión' });
        await logoutOption.waitFor({ state: 'visible', timeout: 10000 });
        await logoutOption.scrollIntoViewIfNeeded();
        await logoutOption.click({ force: true });

        // Wait for navigation to login
        await page.waitForURL('**/login');
      },

      register: async (credentials: UserCredentials) => {
        await page.goto('/register');
        await page.locator('input[name="name"]').fill(credentials.name || 'Test User');
        await page.locator('input[name="email"]').fill(credentials.email);
        await page.locator('input[name="password"]').fill(credentials.password);
        await page.locator('input[name="organizationName"]').fill(credentials.organization || 'Test Organization');
        await page.locator('form button').click();

        // Wait for navigation to projects
        await page.waitForURL('**/projects');
      },

      deleteAccount: async (credentials: UserCredentials) => {
        // Login first to access profile
        await page.goto('/login');
        await page.locator('input[name="email"]').fill(credentials.email);
        await page.locator('input[name="password"]').fill(credentials.password);
        await page.locator('form button').click();
        await page.waitForURL('**/projects');

        // Navigate to profile page - click profile button (which opens dropdown)
        const profileButton = page.locator('button').filter({ has: page.locator('span') }).first();
        await profileButton.waitFor({ state: 'visible', timeout: 10000 });
        await profileButton.click();

        // Wait for dropdown to appear
        await page.locator('a[href="/profile"]').waitFor({ state: 'visible', timeout: 10000 });

        // Use different approach for Webkit - click using JavaScript if regular click fails
        const profileLink = page.locator('a[href="/profile"]');
        await profileLink.scrollIntoViewIfNeeded();

        // Try to click the element, and if it fails due to being outside viewport,
        // try using JavaScript click as fallback
        try {
          await profileLink.click({ timeout: 5000 });
        } catch (error) {
          console.log('Regular click failed, trying JS click:', error instanceof Error ? error.message : String(error));
          await profileLink.evaluate((el) => {
            if ('click' in el && typeof el.click === 'function') {
              el.click();
            } else {
              // Fallback for SVG elements
              const event = new MouseEvent('click', { bubbles: true });
              el.dispatchEvent(event);
            }
          });
        }
        // Wait a bit more for navigation to complete in Webkit
        await page.waitForURL('**/profile');

        // Enter confirmation text
        await page.locator('input[placeholder="DELETE"]').fill('DELETE');

        // Wait for network response when clicking delete
        const deletePromise = page.waitForResponse(response =>
          response.url().includes('/api/account/delete')
        );

        // Click delete button
        await page.locator('button:has-text("Eliminar cuenta y datos")').click();

        // Wait for the response
        const deleteResponse = await deletePromise;
        console.log('Delete response status:', deleteResponse.status());
        console.log('Delete response body:', await deleteResponse.text());

        // Wait for redirect to login page after account deletion
        await expect(page).toHaveURL(/\/login$/);
      }
    };

    await use(auth);
  },

  // Add database utilities fixture
  dbUtils: async ({ page }, use) => {
    const dbUtils = new DatabaseTestUtils(page);
    await use(dbUtils);
  },

  // Add unique user credentials fixture for each test
  userCredentials: async ({}, use) => {
    const credentials = TestUserUtils.createUserCredentials();
    await use(credentials);
  }
});

export { expect } from '@playwright/test';