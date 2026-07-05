import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    maxPasswordLength: 128,
    minPasswordLength: 8,
  },
  advanced: {
    database: {
      generateId: false,
    },
  },
  user: {
    additionalFields: {
      designation: {
        type: "string",
        required: true,
        input: true,
        defaultValue: "WEB_DEVELOPER",
      },
    },
  },
  session: {
    expiresIn: 259200, // 3 days
    updateAge: 86400, // 1 day
    cookieCache: {
      enabled: true, // Enable caching session in cookie (default: `false`)
      maxAge: 300, // 5 minutes
    },
  },
  account: {
    accountLinking: { // link multiple accounts to a single or same user
      trustedProviders: ["google", "github", "email-password"],
    },
  },
  socialProviders: {
    google: {
      prompt: "select_account",
      accessType: "offline",
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
    github: {
      prompt: "select_account",
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },
  trustedOrigins: [
    (process.env.BETTER_AUTH_URL as string) || "http://localhost:3000",
  ],
  plugins: [nextCookies()], // make sure this is the last plugin in the array
});
