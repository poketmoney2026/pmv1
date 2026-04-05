import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_ROUTES = ["/user/signup", "/user/signin"];
const USER_BASE_ROUTES = ["/", "/user/deposit", "/user/withdraw", "/user/profile", "/user/settings", "/user/contact", "/user/transactions", "/user/income-calculate", "/user/download", "/user/plan-and-balance-claim", "/user/leaderboard", "/user/referral", "/user/notice", "/user/live-chat"];
const ADMIN_BASE_ROUTES = ["/admin/interest", "/admin/addbalance", "/admin/links", "/admin/general", "/admin/withdraws", "/admin/users", "/admin/approve-deposit", "/admin/payment-methods", "/admin/notice", "/admin/live-chat", "/admin/leaderboard"];

function isSkippablePath(pathname) {
  return pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.startsWith('/assets') || pathname === '/favicon.ico' || pathname === '/robots.txt' || pathname === '/sitemap.xml';
}
function matchRoute(pathname, baseList) {
  return baseList.some((base) => base === '/' ? pathname === '/' : pathname === base || pathname.startsWith(`${base}/`));
}
const secret = new TextEncoder().encode(process.env.JWT_SECRET || '');

async function readAuth(request) {
  const token = request.cookies.get('token')?.value;
  if (!token || !process.env.JWT_SECRET) return { authed: false, role: 'user' };
  try {
    const { payload } = await jwtVerify(token, secret);
    const role = String(payload?.role || 'user').toLowerCase();
    return { authed: true, role: role === 'admin' ? 'admin' : 'user' };
  } catch {
    return { authed: false, role: 'user' };
  }
}

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  if (isSkippablePath(pathname)) return NextResponse.next();
  const { authed, role } = await readAuth(request);
  const publicHit = matchRoute(pathname, PUBLIC_ROUTES);
  const userHit = matchRoute(pathname, USER_BASE_ROUTES);
  const adminHit = matchRoute(pathname, ADMIN_BASE_ROUTES);

  if (authed) {
    if (publicHit) return NextResponse.redirect(new URL(role === 'admin' ? '/admin/users' : '/', request.url));
    if (adminHit) return role === 'admin' ? NextResponse.next() : NextResponse.redirect(new URL('/', request.url));
    if (userHit) return role === 'admin' ? NextResponse.redirect(new URL('/admin/users', request.url)) : NextResponse.next();
    return NextResponse.redirect(new URL(role === 'admin' ? '/admin/users' : '/', request.url));
  }

  if (adminHit || userHit) return NextResponse.redirect(new URL('/user/signin', request.url));
  if (publicHit) return NextResponse.next();
  return NextResponse.redirect(new URL('/user/signin', request.url));
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|assets).*)'],
};
