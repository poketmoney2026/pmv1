import { NextResponse } from "next/server"
import dbConnect from "@/lib/dbConnect"
import User from "@/models/User"
import { getUserIdFromToken } from "@/lib/auth"

const clean = (s) => String(s || "").trim()

export async function GET() {
  try {
    await dbConnect()
    const uid = await getUserIdFromToken()
    if (!uid) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

    const me = await User.findById(uid).select("referralCode referrals").lean()
    if (!me) return NextResponse.json({ message: "User not found" }, { status: 404 })

    const referralCode = clean(me.referralCode)
    const referralLink = `https://poketmoney.online/user/signup?ref=${encodeURIComponent(referralCode || "")}`

    const ids = Array.isArray(me.referrals) ? me.referrals : []
    const referredUsers = ids.length
      ? await User.find({ _id: { $in: ids } }).select("fullName joinDate").lean()
      : []

    const byId = new Map(referredUsers.map((u) => [String(u._id), u]))
    const referrals = ids
      .map((id) => {
        const u = byId.get(String(id))
        if (!u) return null
        return { id: String(u._id), name: clean(u.fullName) || "User", joinedAt: u.joinDate ? new Date(u.joinDate).toISOString() : null }
      })
      .filter(Boolean)

    return NextResponse.json(
      { referralCode, referralLink, totalReferred: referrals.length, referrals },
      { status: 200 }
    )
  } catch {
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}