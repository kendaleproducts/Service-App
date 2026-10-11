import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, verifySessionToken } from "@/lib/auth";

/** Optimistic auth gate for the client portal and the firm desk. Pages re-check the session themselves. */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const claims = verifySessionToken(request.cookies.get(COOKIE_NAME)?.value);

  if (pathname.startsWith("/portal") || pathname.startsWith("/firm")) {
    if (!claims) {
      const signIn = new URL("/sign-in", request.url);
      signIn.searchParams.set("next", pathname);
      return NextResponse.redirect(signIn);
    }
    if (pathname.startsWith("/firm") && claims.role !== "staff") {
      return NextResponse.redirect(new URL("/portal", request.url));
    }
    if (pathname.startsWith("/portal") && claims.role !== "client") {
      return NextResponse.redirect(new URL("/firm", request.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/portal/:path*", "/firm/:path*"],
};
