import { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ClientsPage extends BasePage {
  private readonly createClientButton = 'button:has-text("Crear cliente")';
  private readonly searchInput = 'input[type="search"]';
  private readonly confirmDeleteButton = 'button:has-text("Eliminar")';

  constructor(page: Page) {
    super(page);
  }

  async navigateTo() {
    await this.page.goto('/clients');
  }

  // Drives the Radix dialog rendered by ClientsTable + CreateClientForm
  // (src/ui/components/clients/CreateClientForm.tsx). Labels come from the
  // form's <label htmlFor> pairs; the submit button reads "Guardar cliente"
  // ("Guardando..." while pending), never "Crear cliente" — that is the trigger.
  async createClient(
    name: string,
    type: string,
    value: string,
    startDate?: string,
    endDate?: string,
  ) {
    const start = startDate ?? new Date().toISOString().slice(0, 10);
    const end =
      endDate ??
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    await this.page.getByRole('button', { name: 'Crear cliente' }).click();

    const dialog = this.page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await dialog.getByLabel('Nombre').fill(name);
    await dialog.getByLabel('Tipo').selectOption(type);
    await dialog.getByLabel('Valor del contrato (DOP)').fill(value);
    await dialog.getByLabel('Fecha de inicio').fill(start);
    await dialog.getByLabel('Fecha de cierre').fill(end);

    await dialog.getByRole('button', { name: /Guardar cliente/ }).click();

    await expect(
      dialog.getByText('Cliente creado correctamente.'),
    ).toBeVisible();
    // The form does not auto-close the modal on success; dismiss it with
    // Escape (Radix Dialog closes on Escape). A click on the Cancel button
    // stalls in webkit ("performing click action" never completes) — the same
    // portaled-element issue documented in workspace.spec.ts, so use the
    // keyboard path instead.
    await this.page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
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
