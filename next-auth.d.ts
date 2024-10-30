import { DefaultUser } from "next-auth";
declare module "next-auth" {
  interface Session {
    user?: DefaultUser & { id: string; isAdmin: boolean };
  }
  interface User extends DefaultUser {
    isAdmin: boolean;
  }
}
