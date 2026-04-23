
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_ROUTES = ["/user/signup", "/user/signin"];
const USER_BASE_ROUTES = ["/", "/user/deposit", "/user/withdraw", "/user/profile", "/user/settings", "/user/theme", "/user/sound", "/user/contact", "/user/help", "/user/tutorial", "/user/about", "/user/transactions", "/user/income-calculate", "/user/download", "/user/plan-and-balance-claim", "/user/leaderboard", "/user/referral", "/user/notice", "/user/live-chat"];
const ADMIN_BASE_ROUTES = ["/admin/interest", "/admin/addbalance", "/admin/links", "/admin/general", "/admin/theme", "/admin/transactions", "/admin/documents", "/admin/download", "/admin/analytics", "/admin/help", "/admin/tutorial", "/admin/site-updating", "/admin/withdraws", "/admin/users", "/admin/approve-deposit", "/admin/payment-methods", "/admin/notice", "/admin/live-chat", "/admin/leaderboard", "/admin/referral", "/admin/roles"];
const AGENT_BASE_ROUTES = ["/agent", "/agent/deposit-verify", "/agent/deposit", "/agent/withdraw", "/agent/transactions", "/agent/transaction", "/agent/profile", "/agent/referral", "/agent/help", "/agent/tutorial", "/agent/settings", "/agent/theme", "/agent/sound", "/agent/live-chat", "/agent/notice", "/agent/download", "/agent/download-apps"];

function isSkippablePath(pathname) {
  return pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.startsWith('/assets') || pathname.startsWith('/apps') || pathname === '/favicon.ico' || pathname === '/robots.txt' || pathname === '/sitemap.xml' || /\/[\w.-]+\.[a-zA-Z0-9]+$/.test(pathname);
}
function matchRoute(pathname, baseList) {
  return baseList.some((base) => base === '/' ? pathname === '/' : pathname === base || pathname.startsWith(`${base}/`));
}
const secret = new TextEncoder().encode(process.env.JWT_SECRET || '');
function normalizeRole(input) {
  const role = String(input || 'user').toLowerCase();
  return ['admin', 'agent', 'user'].includes(role) ? role : 'user';
}
function homeForRole(role) {
  if (role === 'admin') return '/admin/approve-deposit';
  if (role === 'agent') return '/agent/deposit-verify';
  return '/';
}

async function readAuth(request) {
  const token = request.cookies.get('token')?.value;
  if (!token || !process.env.JWT_SECRET) return { authed: false, role: 'user' };
  try {
    const { payload } = await jwtVerify(token, secret);
    return { authed: true, role: normalizeRole(payload?.role) };
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
  const agentHit = matchRoute(pathname, AGENT_BASE_ROUTES);

  if (authed) {
    if (publicHit) return NextResponse.redirect(new URL(homeForRole(role), request.url));
    if (adminHit) return role === 'admin' ? NextResponse.next() : NextResponse.redirect(new URL(homeForRole(role), request.url));
    if (agentHit) return role === 'agent' ? NextResponse.next() : NextResponse.redirect(new URL(homeForRole(role), request.url));
    if (userHit) return role === 'user' ? NextResponse.next() : NextResponse.redirect(new URL(homeForRole(role), request.url));
    return NextResponse.redirect(new URL(homeForRole(role), request.url));
  }

  if (adminHit || userHit || agentHit) return NextResponse.redirect(new URL('/user/signin', request.url));
  if (publicHit) return NextResponse.next();
  return NextResponse.redirect(new URL('/user/signin', request.url));
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|assets).*)'],
};
