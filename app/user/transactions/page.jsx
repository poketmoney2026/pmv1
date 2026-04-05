// Transactions/page.jsx
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import dbConnect from "@/lib/dbConnect";
import Transaction from "@/models/Transaction";
import TransactionsClient from "./TransactionsClient";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

async function getUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value || "";
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload?.userId ? String(payload.userId) : null;
  } catch {
    return null;
  }
}

export default async function Page() {
  const userId = await getUserId();
  if (!userId) return <TransactionsClient initial={[]} unauthorized />;

  await dbConnect();

  const list = await Transaction.find({ user: userId })
    .sort({ date: -1, createdAt: -1 })
    .limit(300)
    .select("_id type status amount note date createdAt")
    .lean();

  const initial = list.map((t) => ({
    id: String(t._id),
    type: t.type,
    status: t.status,
    amount: t.amount,
    note: t.note || "",
    date: t.date || t.createdAt,
  }));

  return <TransactionsClient initial={initial} />;
}
