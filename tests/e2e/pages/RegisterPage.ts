import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class RegisterPage extends BasePage {
  private readonly nameInput = 'input[name="name"]';
  private readonly emailInput = 'input[name="email"]';
  private readonly passwordInput = 'input[name="password"]';
  private readonly organizationInput = 'input[name="organizationName"]';
  private readonly registerButton = 'button:has-text("Crear y acceder")';
  private readonly loginLink = 'a:has-text("Inicia sesión")';
  private readonly errorMessage = 'p.text-sm.text-destructive';

  constructor(page: Page) {
    super(page);
  }

  async goTo() {
    await this.page.goto('/register');
  }

  async register(name: string, email: string, password: string, organization: string) {
    await this.fill(this.nameInput, name);
    await this.fill(this.emailInput, email);
    await this.fill(this.passwordInput, password);
    await this.fill(this.organizationInput, organization);
    await this.click(this.registerButton);
  }

  async goToLoginPage() {
    await this.click(this.loginLink);
  }

  async getErrorMessage() {
    if (await this.isVisible(this.errorMessage)) {
      return await this.getText(this.errorMessage);
    }
    return null;
  }

  async waitForRegistrationError() {
    await this.waitForSelector(this.errorMessage, { state: 'visible', timeout: 5000 });
  }

  async isRegisterFormVisible() {
    return await this.isVisible(this.nameInput) &&
           await this.isVisible(this.emailInput) &&
           await this.isVisible(this.passwordInput) &&
           await this.isVisible(this.organizationInput) &&
           await this.isVisible(this.registerButton);
  }
}