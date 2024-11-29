import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { prisma } from "./database";

export const authOptions: AuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.isActive) {
          throw new Error("User not found");
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password,
          user.password,
        );

        if (!isValidPassword) {
          throw new Error("Invalid password");
        }
        const userWithOrgs = await prisma.user.findUnique({
          where: { email: user?.email },
          include: {
            organizations: {
              select: {
                organizationId: true,
              },
            },
          },
        });

        return {
          id: user.id.toString(),
          email: user.email,
          username: user.username,
          name: user.name,
          isAdmin: user.isAdmin,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          isVerified: user.isVerified,
          organizations:
            userWithOrgs?.organizations.map((org) => ({
              id: org.organizationId,
            })) || [],
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (trigger === "update") {
        const userWithOrgs = await prisma.user.findUnique({
          where: { email: token.email! },
          include: {
            organizations: {
              select: {
                organizationId: true,
              },
            },
          },
        });

        token.organizations =
          userWithOrgs?.organizations.map((org) => ({
            id: org.organizationId,
          })) || [];
        console.log("🚀 ~ jwt ~ token.organizations:", token.organizations);
      }
      if (user) {
        token.isAdmin = user.isAdmin;
        token.isVerified = user.isVerified;

        // Añadir organizaciones al token
        const userWithOrgs = await prisma.user.findUnique({
          where: { email: user.email! },
          include: {
            organizations: {
              select: {
                organizationId: true,
              },
            },
          },
        });

        token.organizations =
          userWithOrgs?.organizations.map((org) => ({
            id: org.organizationId,
          })) || [];
      }
      console.log("TOKEN: " + JSON.stringify(token, null, 2));
      return token;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session(session: any) {
      const user = await prisma.user.findUnique({
        where: { email: session.token.email },
      });
      const userWithOrgs = await prisma.user.findUnique({
        where: { email: user?.email },
        include: {
          organizations: {
            select: {
              organizationId: true,
            },
          },
        },
      });
      session.organizations =
        userWithOrgs?.organizations.map((org) => ({
          id: org.organizationId,
        })) || [];
      session.user = user;
      return session;
    },
  },
};
