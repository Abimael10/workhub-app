import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  private readonly emailInput = 'input[name="email"]';
  private readonly passwordInput = 'input[name="password"]';
  private readonly loginButton = 'button:has-text("Entrar al panel")';
  private readonly registerLink = 'a:has-text("Regístrate aquí")';
  private readonly errorMessage = 'p.text-sm.text-destructive';

  constructor(page: Page) {
    super(page);
  }

  async goTo() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.fill(this.emailInput, email);
    await this.fill(this.passwordInput, password);

    // Wait for button to be available and then click
    const loginButton = this.page.locator(this.loginButton);
    await loginButton.waitFor({ state: 'visible', timeout: 10000 });
    await loginButton.click();
  }

  async goToRegisterPage() {
    await this.click(this.registerLink);
  }

  async getErrorMessage() {
    if (await this.isVisible(this.errorMessage)) {
      return await this.getText(this.errorMessage);
    }
    return null;
  }

  async waitForLoginError() {
    await this.waitForSelector(this.errorMessage, { state: 'visible', timeout: 5000 });
  }

  async isLoginFormVisible() {
    return await this.isVisible(this.emailInput) && 
           await this.isVisible(this.passwordInput) && 
           await this.isVisible(this.loginButton);
  }
}