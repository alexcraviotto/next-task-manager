import { DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user?: DefaultUser & {
      isAdmin: boolean;
      username: string;
      name: string;
      isVerified?: boolean;
      organizations?: { id: string }[];
    };
  }

  interface User extends DefaultUser {
    isAdmin: boolean;
    username: string;
    name: string;
    isVerified?: boolean;
    organizations?: { id: string }[];
  }
}
