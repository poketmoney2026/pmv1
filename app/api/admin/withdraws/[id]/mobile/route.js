import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import dbConnect from "@/lib/dbConnect";
import Withdraw from "@/models/Withdraw";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);
async function requireAdmin(req) {
  const token = req.cookies.get("token")?.value;
  if (!token) return { ok: false, res: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) };
  try { const { payload } = await jwtVerify(token, secret); if (String(payload?.role || "user").toLowerCase() !== "admin") return { ok: false, res: NextResponse.json({ message: "Forbidden" }, { status: 403 }) }; return { ok: true }; } catch { return { ok: false, res: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) }; }
}
export async function PUT(req, ctx) {
  const auth = await requireAdmin(req); if (!auth.ok) return auth.res;
  await dbConnect();
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const mobile = String(body.mobile || "").replace(/\D/g, "").trim();
  if (!/^01\d{9}$/.test(mobile)) return NextResponse.json({ ok:false, message:"Invalid mobile" }, { status:400 });
  const updated = await Withdraw.findByIdAndUpdate(String(id || ""), { $set: { mobile } }, { new: true }).lean();
  if (!updated) return NextResponse.json({ ok:false, message:"Withdraw not found" }, { status:404 });
  return NextResponse.json({ ok:true, message:"Mobile updated", data:{ _id:String(updated._id), mobile:String(updated.mobile || "") } });
}
