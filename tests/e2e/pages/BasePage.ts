import { Page } from '@playwright/test';

export class BasePage {
  protected page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigateTo(url: string) {
    await this.page.goto(url);
  }

  async waitForURL(pattern: string | RegExp) {
    await this.page.waitForURL(pattern);
  }

  async getTitle() {
    return await this.page.title();
  }

  async waitForSelector(selector: string, options?: { timeout?: number; state?: 'attached' | 'detached' | 'visible' | 'hidden' }) {
    return await this.page.waitForSelector(selector, options || {});
  }

  async isVisible(selector: string) {
    return await this.page.locator(selector).isVisible();
  }

  async isHidden(selector: string) {
    return await this.page.locator(selector).isHidden();
  }

  async click(selector: string) {
    await this.page.locator(selector).click();
  }

  async fill(selector: string, value: string) {
    await this.page.locator(selector).fill(value);
  }

  async getText(selector: string) {
    return await this.page.locator(selector).textContent();
  }

  async waitForTimeout(timeout: number) {
    await this.page.waitForTimeout(timeout);
  }
}