import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = req.cookies.get("ccs-role")?.value;

  // Painel interno — exige role admin ou operador
  if (pathname.startsWith("/admin") || pathname.startsWith("/operador")) {
    if (!session || (session !== "admin" && session !== "operador")) {
      const url = req.nextUrl.clone();
      url.pathname = "/painel/login";
      url.search = `?redirect=${encodeURIComponent(pathname)}`;
      return NextResponse.redirect(url);
    }
    // Operador só pode acessar /operador
    if (session === "operador" && pathname.startsWith("/admin")) {
      const url = req.nextUrl.clone();
      url.pathname = "/operador";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/operador/:path*"],
};
