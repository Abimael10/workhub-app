import { Page } from '@playwright/test';

/**
 * Database utilities for E2E testing
 * These functions would interact with a test database or API endpoints
 */
export class DatabaseTestUtils {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Clear test data from database
   * This would typically call API endpoints or directly interact with the test database
   */
  async clearTestData(): Promise<void> {
    // Example: Delete all test user data
    await this.page.request.delete('/api/test/clear-data', {
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }

  /**
   * Seed database with test data
   */
  async seedTestData(): Promise<void> {
    // Example: Create test data needed for tests
    await this.page.request.post('/api/test/seed-data', {
      data: {
        users: [
          {
            email: 'test@example.com',
            name: 'Test User',
            password: 'securePassword123'
          }
        ],
        organizations: [
          {
            name: 'Test Organization',
            description: 'Organization for testing'
          }
        ]
      }
    });
  }

  /**
   * Create a test user directly in the database
   */
  async createTestUser(userData: {
    email: string;
    name: string;
    password: string;
    organizationId?: string;
  }) {
    const response = await this.page.request.post('/api/test/users', {
      data: userData
    });
    
    if (!response.ok()) {
      throw new Error(`Failed to create test user: ${await response.text()}`);
    }
    
    return await response.json();
  }

  /**
   * Clean up specific test user
   */
  async deleteTestUser(userId: string) {
    const response = await this.page.request.delete(`/api/test/users/${userId}`);
    
    if (!response.ok()) {
      throw new Error(`Failed to delete test user: ${await response.text()}`);
    }
  }

  /**
   * Create a test organization
   */
  async createTestOrganization(orgData: {
    name: string;
    description: string;
  }) {
    const response = await this.page.request.post('/api/test/organizations', {
      data: orgData
    });
    
    if (!response.ok()) {
      throw new Error(`Failed to create test organization: ${await response.text()}`);
    }
    
    return await response.json();
  }

  /**
   * Reset database to initial state
   */
  async resetDatabase() {
    // Clear all test data
    await this.clearTestData();
    
    // Seed with baseline data
    await this.seedTestData();
  }
}