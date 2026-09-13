import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

/**
 * Middleware:
 *  - Refresh session cookies, ať se JWT neukončí během requestu.
 *  - Redirect na /login pokud uživatel není přihlášen a chce na chráněnou route.
 *  - Propaguje `x-pathname` na request headers → root layout podle ní vybírá shell variant.
 */

const PUBLIC_ROUTES = ["/", "/login", "/signup", "/register", "/forgot-password", "/manifest.webmanifest"];
const isPublic = (path: string) =>
  PUBLIC_ROUTES.includes(path)
  || path.startsWith("/gpc")
  || path.startsWith("/ss") // SmartSplit demo — veřejné pro review grafiky

  || path.startsWith("/auth/")
  || path.startsWith("/_next")
  || path.startsWith("/api")
  // public static assets
  || /\.(svg|png|jpg|jpeg|gif|webp|ico|webmanifest|json)$/i.test(path);

export async function middleware(req: NextRequest) {
  // Pošli pathname jako request header → server components ho přečtou přes `headers()`.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", req.nextUrl.pathname);

  const res = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value);
            res.cookies.set({ name, value, ...(options as CookieOptions) });
          });
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  const path = req.nextUrl.pathname;
  if (!user && !isPublic(path)) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
