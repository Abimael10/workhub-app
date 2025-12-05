import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: DefaultSession["user"] & {
      id: string;
      organizationId: string;
      membershipId: string;
      organizationName?: string | null;
      membershipRole?: string | null;
    };
  }

  interface User {
    id: string;
    organizationId: string;
    membershipId: string;
    organizationName?: string | null;
    membershipRole?: string | null;
  }
}
