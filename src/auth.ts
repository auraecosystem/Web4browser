import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isApiRoute = nextUrl.pathname.startsWith("/api/search");
      const isDashboard = nextUrl.pathname === "/";

      // Deny access if a user attempts to view search layouts while logged out
      if ((isDashboard || isApiRoute) && !isLoggedIn) {
        return false;
      }
      return true;
    },
  },
  pages: {
    signIn: "/", // Reuse home path for custom elegant splash sign-in UI
  },
});
