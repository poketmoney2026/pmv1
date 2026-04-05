import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import dbConnect from "@/lib/dbConnect";
import Transaction from "@/models/Transaction";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

async function getUserId() {
  const cookieStore = await cookies(); // ✅ async cookies()
  const token = cookieStore.get("token")?.value || "";
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret);
    return payload?.userId ? String(payload.userId) : null;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ ok: false, transactions: [] }, { status: 401 });
    }

    await dbConnect();

    const list = await Transaction.find({ user: userId })
      .sort({ date: -1, createdAt: -1 })
      .limit(300)
      .select("_id type status amount note date createdAt")
      .lean();

    return NextResponse.json(
      {
        ok: true,
        transactions: list.map((t) => ({
          id: String(t._id),
          type: t.type,
          status: t.status,
          amount: t.amount,
          note: t.note || "",
          date: t.date || t.createdAt,
        })),
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("TX_LIST_ERROR:", err);
    return NextResponse.json({ ok: false, transactions: [] }, { status: 500 });
  }
}
