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
  const role = request.cookies.get("gc_user_role")?.value ?? "";

  // ---------------------------------------
  // NOT LOGGED IN → send to login page
  // ---------------------------------------
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ---------------------------------------
  // AFTER LOGIN ROOT REDIRECT
  // ---------------------------------------
  if (pathname === "/") {
    if (role === "Admin")
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));

    const accountingRoles = [
      "Accounting",
      "Accounting Super Admin",
      "Accounts Receivable",
      "Accounts Payable",
      "Messenger",
    ];

    if (accountingRoles.includes(role))
      return NextResponse.redirect(new URL("/accounting", request.url));

    if (role === "Driver")
      return NextResponse.redirect(new URL("/driver/app-required", request.url));

    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ---------------------------------------
  // ADMIN PROTECTED ROUTES
  // ---------------------------------------
  if (pathname.startsWith("/admin")) {
    if (role !== "Admin") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  // ---------------------------------------
  // ACCOUNTING PROTECTED ROUTES
  // ---------------------------------------
  const accountingRoles = [
    "Accounting Super Admin",
    "Accounts Receivable",
    "Accounts Payable",
    "Messenger",
  ];

  if (pathname.startsWith("/accounting")) {
    if (!accountingRoles.includes(role) && role !== "Admin") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  // ---------------------------------------
  // DRIVER PROTECTED ROUTES
  // ---------------------------------------
  if (role === "Driver") {
    if (!pathname.startsWith("/driver")) {
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
