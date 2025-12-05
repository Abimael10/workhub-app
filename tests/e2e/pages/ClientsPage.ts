import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class ClientsPage extends BasePage {
  private readonly createClientButton = 'button:has-text("Crear cliente")';
  private readonly clientNameInput = 'input[name="name"]';
  private readonly clientTypeSelect = 'select[name="type"]';
  private readonly clientValueInput = 'input[name="valueDop"]';
  private readonly saveClientButton = 'button:has-text("Crear cliente")';
  private readonly searchInput = 'input[type="search"]';
  private readonly deleteButton = 'button[aria-label*="Eliminar"]';
  private readonly confirmDeleteButton = 'button:has-text("Eliminar")';

  constructor(page: Page) {
    super(page);
  }

  async navigateTo() {
    await this.page.goto('/clients');
  }

  async createClient(name: string, type: string, value: string) {
    await this.click(this.createClientButton);

    // Wait for modal to appear
    await this.waitForSelector(this.clientNameInput, { state: 'visible', timeout: 10000 });

    await this.fill(this.clientNameInput, name);
    await this.page.locator(this.clientTypeSelect).selectOption(type);
    await this.fill(this.clientValueInput, value);

    // Click the submit button - look for the button inside the modal dialog
    // The modal submit button should have a different attribute or be inside a dialog
    const modalSubmitButton = this.page.locator('dialog button:has-text("Crear cliente"), [role="dialog"] button:has-text("Crear cliente")');
    if (await modalSubmitButton.count() > 0) {
      await modalSubmitButton.first().click();
    } else {
      // If no dialog button found, try clicking the last button which is typically the submit button
      const allButtons = this.page.locator('button:has-text("Crear cliente")');
      const count = await allButtons.count();
      if (count > 1) {
        // Click the last button (submit button), not the first (trigger button)
        await allButtons.last().click();
      } else {
        // If only one button, click it
        await allButtons.first().click();
      }
    }

    // Wait for modal to close
    await this.waitForTimeout(2000);
  }

  async deleteClient(clientName: string) {
    // Click the delete button for the specific client
    await this.click(`button[aria-label*="Eliminar ${clientName}"]`);
    await this.click(this.confirmDeleteButton);
    await this.waitForTimeout(1000); // Wait for deletion to complete
  }

  async filterClients(filterText: string) {
    await this.fill(this.searchInput, filterText);
    await this.waitForTimeout(500); // Wait for filter to apply
  }

  async isClientVisible(clientName: string) {
    return await this.isVisible(`text=${clientName}`);
  }

  async isClientNotVisible(clientName: string) {
    return await this.isHidden(`text=${clientName}`);
  }
}