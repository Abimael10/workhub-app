import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class DashboardPage extends BasePage {
  private readonly projectsLink = 'a[href="/projects"]';
  private readonly clientsLink = 'a[href="/clients"]';
  private readonly filesLink = 'a[href="/files"]';
  private readonly profileButton = 'button:has-text("Cerrar sesión")'; // The button that contains the logout option
  private readonly logoutButton = 'span:has-text("Cerrar sesión")';
  private readonly welcomeText = 'h1:has-text("Proyectos")'; // Default dashboard page is projects

  constructor(page: Page) {
    super(page);
  }

  async navigateToProjects() {
    // Use a more specific selector to target the projects link in the sidebar
    await this.click(this.projectsLink);
  }

  async navigateToClients() {
    await this.click(this.clientsLink);
  }

  async navigateToFiles() {
    await this.click(this.filesLink);
  }

  async logout() {
    // Click on the profile button (first button with span inside)
    const profileButton = this.page.locator('button').filter({ has: this.page.locator('span') }).first();
    await profileButton.waitFor({ state: 'visible', timeout: 10000 });
    await profileButton.click();

    // Wait for the dropdown menu to appear with a more specific selector
    const logoutOption = this.page.locator('span', { hasText: 'Cerrar sesión' });
    await logoutOption.waitFor({ state: 'visible', timeout: 10000 });

    // Scroll the logout option into view to ensure it's clickable
    await logoutOption.scrollIntoViewIfNeeded();

    // Use different approach for Webkit - click using JavaScript if regular click fails
    try {
      await logoutOption.click({ force: true, timeout: 5000 });
    } catch (error) {
      console.log('Regular click failed, trying JS click:', error instanceof Error ? error.message : String(error));
      await logoutOption.evaluate((el) => {
        if ('click' in el && typeof el.click === 'function') {
          el.click();
        } else {
          // Fallback for SVG elements
          const event = new MouseEvent('click', { bubbles: true });
          el.dispatchEvent(event);
        }
      });
    }
  }

  async isProjectsPageVisible() {
    return await this.isVisible(this.welcomeText);
  }

  async isNavigationLinksVisible() {
    return await this.isVisible(this.projectsLink) && 
           await this.isVisible(this.clientsLink) && 
           await this.isVisible(this.filesLink);
  }
}