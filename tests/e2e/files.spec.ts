import { test, expect } from './helpers/test-fixtures';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';

test.describe('File Management', () => {
  test.beforeEach(async ({ page, userCredentials }) => {
    // Register a new user first, since login is required for file management
    const registerPage = new RegisterPage(page);
    const dashboardPage = new DashboardPage(page);

    await registerPage.goTo();
    await registerPage.register(
      userCredentials.name!,
      userCredentials.email,
      userCredentials.password,
      userCredentials.organization!
    );

    // Navigate to files page
    await dashboardPage.waitForURL(/\/projects$/);
    await dashboardPage.page.locator('a[href="/files"]').click();
    await expect(page).toHaveURL(/\/files$/);
  });

  test('should upload a file', async ({ page }) => {
    // Open the upload modal via an unambiguous, strict-mode-safe locator
    await page.getByRole('button', { name: 'Subir archivo' }).click();

    // Wait for the modal to open
    await expect(page.getByText('Sube un nuevo documento')).toBeVisible();
    await expect(
      page.getByText('Arrastra archivos o haz clic para buscarlos')
    ).toBeVisible();

    // Drive react-dropzone directly through its hidden file input (noClick is enabled,
    // so clicking the dropzone does nothing; setInputFiles fires the change event onDrop listens for)
    const fileName = `e2e-upload-${Date.now()}.txt`;
    await page.locator('input[type="file"]').setInputFiles({
      name: fileName,
      mimeType: 'text/plain',
      buffer: Buffer.from('contenido de prueba e2e'),
    });

    // The pending upload row should appear with the description pre-filled from the file name
    await expect(page.getByText('Cargas pendientes')).toBeVisible();

    // Perform the real upload to /api/files/upload (S3 via MinIO)
    await page.getByRole('button', { name: 'Subir archivos' }).click();

    // Success toast confirms the upload request succeeded
    await expect(page.getByText(`${fileName} subido`)).toBeVisible();

    // Dismiss the modal so the grid is unobstructed
    await page.keyboard.press('Escape');

    // The uploaded file must land in the grid, proving the list refreshed.
    // Allow extra time for the DB round-trip that repopulates the file list.
    await expect(page.getByRole('heading', { name: fileName })).toBeVisible({ timeout: 15000 });
  });

  test('should display files page correctly', async ({ page }) => {
    // Verify the files page elements are present
    await expect(page.locator('h1')).toContainText('Archivos');
    await expect(page.getByText('Carga directo a S3')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Subir archivo' })).toBeVisible();
  });
});
