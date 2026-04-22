import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import VisitSession from "@/models/VisitSession";
import VisitEvent from "@/models/VisitEvent";
import { getAuthUserFromRequest } from "@/lib/auth";

function normalizePath(input) {
  const raw = String(input || "/").trim();
  if (!raw) return "/";
  const noHash = raw.split("#")[0] || "/";
  const noQuery = noHash.split("?")[0] || "/";
  return noQuery.startsWith("/") ? noQuery : `/${noQuery}`;
}

export async function POST(req) {
  const auth = await getAuthUserFromRequest(req, { allowInactive: true });
  if (!auth.ok) return auth.res;

  await dbConnect();

  const body = await req.json().catch(() => ({}));
  const sessionKey = String(body?.sessionKey || "").trim().slice(0, 120);
  if (!sessionKey) {
    return NextResponse.json({ ok: false, message: "Missing session key" }, { status: 400 });
  }

  const pathname = normalizePath(body?.pathname || "/");
  const now = new Date();
  const userAgent = req.headers.get("user-agent") || "";
  const addClick = body?.click === true ? 1 : 0;
  const eventType = addClick ? "click" : "view";

  await VisitSession.findOneAndUpdate(
    { sessionKey },
    {
      $setOnInsert: {
        sessionKey,
        firstSeenAt: now,
      },
      $set: {
        userId: auth.userId,
        fullName: auth?.user?.fullName || "",
        mobile: auth?.user?.mobile || "",
        role: auth?.user?.role || "user",
        currentPath: pathname,
        lastSeenAt: now,
        userAgent,
      },
      $inc: {
        pingCount: addClick ? 0 : 1,
        clickCount: addClick,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await VisitEvent.create({
    sessionKey,
    userId: auth.userId,
    fullName: auth?.user?.fullName || "",
    mobile: auth?.user?.mobile || "",
    role: auth?.user?.role || "user",
    path: pathname,
    eventType,
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
