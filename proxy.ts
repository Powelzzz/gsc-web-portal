import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // PUBLIC ROUTES
  const publicRoutes = ["/login", "/register", "/forgot-password"];
  const isPublic = publicRoutes.some(
    (p) => pathname === p || pathname.startsWith(p)
  );

  if (isPublic) return NextResponse.next();

  // READ COOKIES
  const token = request.cookies.get("gc_token")?.value || null;
  const role = request.cookies.get("gc_user_role")?.value || null;

  // NOT LOGGED IN → redirect to login
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ROOT ROUTING
  if (pathname === "/") {
    if (role === "Admin") {
      return NextResponse.redirect(new URL("/accounting", request.url));
    }

    if (role === "Driver") {
      return NextResponse.redirect(new URL("/driver/app-required", request.url));
    }

    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ADMIN PROTECTION
  if (pathname.startsWith("/admin")) {
    if (role !== "Admin") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  // DRIVER RESTRICTION
  if (role === "Driver") {
    if (!pathname.startsWith("/driver/app-required")) {
      return NextResponse.redirect(new URL("/driver/app-required", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$|api).*)",
  ],
};
