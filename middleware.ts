import { default as globalConfig } from "@/lib/config"
import { getSessionCookie } from "better-auth/cookies"
import { NextRequest, NextResponse } from "next/server"
import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';

const intlMiddleware = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
  const isProtectedPath = ["/transactions", "/settings", "/export", "/import", "/unsorted", "/files", "/dashboard"].some(prefix => 
    request.nextUrl.pathname.startsWith(prefix) || request.nextUrl.pathname.match(new RegExp(`^\\/(en|es)${prefix}`))
  );

  if (isProtectedPath && !globalConfig.selfHosted.isEnabled) {
    const sessionCookie = getSessionCookie(request, { cookiePrefix: "taxio" })
    if (!sessionCookie) {
      const locale = request.nextUrl.pathname.split('/')[1] || routing.defaultLocale;
      const validLocale = routing.locales.includes(locale as any) ? locale : routing.defaultLocale;
      return NextResponse.redirect(new URL(`/${validLocale}${globalConfig.auth.loginUrl}`, request.url));
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/', '/(es|en)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)']
};
