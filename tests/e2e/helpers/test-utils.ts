import { Page, expect } from '@playwright/test';
import { UserCredentials } from './test-fixtures';

/**
 * Utility to create a test user via API
 */
export async function createTestUser(page: Page, userData: UserCredentials): Promise<string> {
  // This would typically call an API endpoint to create a user
  // For now, we'll simulate the creation
  const response = await page.request.post('/api/users', {
    data: {
      email: userData.email,
      password: userData.password,
      name: userData.name || 'Test User',
    }
  });
  
  expect(response.status()).toBe(201);
  const result = await response.json();
  return result.userId;
}

/**
 * Utility to clean up test data
 */
export async function cleanupTestData(page: Page, userId: string) {
  // This would typically call an API endpoint to clean up test data
  const response = await page.request.delete(`/api/users/${userId}`);
  expect(response.status()).toBe(200);
}

/**
 * Utility to generate random test data
 */
export function generateRandomString(prefix: string = 'test'): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 15)}`;
}

export function generateRandomEmail(domain: string = 'example.com'): string {
  return `${generateRandomString('user')}@${domain}`;
}

/**
 * Utility to wait for an element to be visible and interactable
 */
export async function waitForElementAndClick(page: Page, selector: string, timeout: number = 10000) {
  const element = page.locator(selector);
  await element.waitFor({ state: 'visible', timeout });
  await expect(element).toBeEnabled({ timeout });
  await element.click();
}

/**
 * Utility to wait for a specific URL pattern
 */
export async function waitForURLPattern(page: Page, pattern: string | RegExp, timeout: number = 10000) {
  await page.waitForURL(pattern, { timeout });
}

/**
 * Utility to test form validation
 */
export async function testFormValidation(
  page: Page, 
  formSelector: string, 
  invalidData: Record<string, string>, 
  expectedError: string
) {
  // Fill form with invalid data
  for (const [field, value] of Object.entries(invalidData)) {
    await page.locator(`input[name="${field}"]`).fill(value);
  }
  
  // Submit form
  await page.locator(`${formSelector} button[type="submit"]`).click();
  
  // Verify error message
  await expect(page.locator(`text=${expectedError}`)).toBeVisible();
}

/**
 * Utility to check if page has loaded completely
 */
export async function waitForPageLoad(page: Page, timeout: number = 10000) {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Utility to capture and save screenshots with timestamp
 */
export async function captureScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({ 
    path: `test-results/screenshots/${name}_${timestamp}.png`,
    fullPage: true 
  });
}

/**
 * Utility to clear browser storage
 */
export async function clearBrowserStorage(page: Page) {
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Utility to set up test environment
 */
export async function setupTestEnvironment(page: Page) {
  // Ensure clean state
  await clearBrowserStorage(page);
  
  // Set any necessary headers or context
  await page.context().setExtraHTTPHeaders({
    'X-Test-Environment': 'true'
  });
}