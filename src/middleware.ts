export { auth as middleware } from "@/auth";

export const config = {
  // Protect all API paths and interface pages while letting asset pipelines run free
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
