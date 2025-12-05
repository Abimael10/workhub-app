export class TestUserUtils {
  static generateUniqueEmail(prefix: string = 'test'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}.${timestamp}.${random}@example.com`;
  }

  static generateUniqueName(prefix: string = 'TestUser'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 6);
    return `${prefix}_${timestamp}_${random}`;
  }

  static generateUniqueOrganization(prefix: string = 'TestOrg'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 6);
    return `${prefix}_${timestamp}_${random}`;
  }

  static createUserCredentials(prefix: string = 'test'): {
    email: string;
    password: string;
    name: string;
    organization: string;
  } {
    return {
      email: this.generateUniqueEmail(prefix),
      password: 'securePassword123',
      name: this.generateUniqueName(`${prefix}Name`),
      organization: this.generateUniqueOrganization(`${prefix}Org`)
    };
  }
}