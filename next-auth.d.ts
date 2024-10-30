import { DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user?: DefaultUser & { isAdmin: boolean };
  }

  interface User extends DefaultUser {
    isAdmin: boolean;
  }
}
