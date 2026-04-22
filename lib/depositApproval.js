import mongoose from "mongoose";
import Deposit from "@/models/Deposit";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import GeneralSettings from "@/models/GeneralSettings";
import ReferralIncome from "@/models/ReferralIncome";

const round2 = (n) => Math.round((Number(n || 0) + Number.EPSILON) * 100) / 100;

async function payReferralBonus({ user, amount, settings, session }) {
  let referralPaid = false;
  let referralMessage = "";
  if (!user?.referredBy) return { referralPaid, referralMessage };

  const firstReferralPercent = Number(settings?.firstReferralBonus ?? 10);
  const regularReferralPercent = Number(settings?.regularReferralBonus ?? 0);
  const refUser = await User.findById(user.referredBy).session(session);
  if (!refUser || String(refUser.status || "active") !== "active") return { referralPaid, referralMessage };

  const alreadyPaid = Boolean(user.referralBonus);
  const bonusPercent = alreadyPaid ? regularReferralPercent : firstReferralPercent;
  const bonus = round2((amount * bonusPercent) / 100);
  if (!(bonus > 0)) {
    if (!alreadyPaid) user.referralBonus = true;
    return { referralPaid, referralMessage };
  }

  refUser.balance = Number(refUser.balance || 0) + bonus;
  const tRef = await Transaction.create([{ user: refUser._id, type: "referralBonus", status: "successful", amount: bonus, note: `Referral bonus credited: Tk${bonus}`, date: new Date() }], { session });
  refUser.transactions = Array.isArray(refUser.transactions) ? refUser.transactions : [];
  refUser.transactions.push(tRef[0]._id);
  await refUser.save({ session });
  await ReferralIncome.findOneAndUpdate(
    { userId: refUser._id },
    { $inc: { amount: bonus }, $setOnInsert: { date: new Date() } },
    { upsert: true, new: true, session }
  );
  referralPaid = true;
  referralMessage = alreadyPaid ? "regular" : "first";
  if (!alreadyPaid) user.referralBonus = true;
  return { referralPaid, referralMessage };
}

export async function approveDepositByActor({ depositId, actorUserId, actorRole = "admin" }) {
  const session = await mongoose.startSession();
  try {
    let result = null;
    await session.withTransaction(async () => {
      const dep = await Deposit.findById(depositId).session(session);
      if (!dep) throw new Error("DEPOSIT_NOT_FOUND");
      if (String(dep.status) !== "processing") throw new Error("ALREADY_PROCESSED");

      const amount = Number(dep.amount || 0);
      if (!Number.isFinite(amount) || amount <= 0) throw new Error("INVALID_DEPOSIT_AMOUNT");

      const user = await User.findById(dep.userId).session(session);
      if (!user) throw new Error("USER_NOT_FOUND");
      if (String(user.status || "active") !== "active") throw new Error("USER_INACTIVE");

      const settings = await GeneralSettings.findOne({ key: "global" }).lean();
      const targetRole = String(user.role || "user").toLowerCase();
      const now = new Date();
      let agentInfo = null;

      if (String(actorRole) === "agent") {
        const agent = await User.findById(actorUserId).session(session);
        if (!agent) throw new Error("AGENT_NOT_FOUND");
        if (String(agent.role || "user").toLowerCase() !== "agent") throw new Error("FORBIDDEN");
        if (String(agent.status || "active") !== "active") throw new Error("AGENT_INACTIVE");
        const agentBalance = Number(agent.balance || 0);
        if (agentBalance < amount) throw new Error("AGENT_BALANCE_LOW");
        agent.balance = round2(agentBalance - amount);
        const targetName = user.fullName || user.mobile || "User";
        const tAgent = await Transaction.create([
          {
            user: agent._id,
            type: "debit",
            status: "successful",
            amount,
            note: `Agent deposit verify successful for ${targetName}: Tk${amount}`,
            date: now,
          },
        ], { session });
        agent.transactions = Array.isArray(agent.transactions) ? agent.transactions : [];
        agent.transactions.push(tAgent[0]._id);
        await agent.save({ session });
        agentInfo = { _id: agent._id, fullName: agent.fullName || agent.mobile || "Agent" };
      }

      dep.status = "success";
      dep.approvedById = actorUserId || null;
      dep.approvedByRole = String(actorRole || "admin");
      dep.approvedByName = agentInfo?.fullName || String(actorRole || "admin").toUpperCase();

      const agentCommissionPercent = Math.max(0, Number(settings?.agentCommissionPercent ?? 0));
      const agentCommissionAmount = targetRole === "agent" ? round2((amount * agentCommissionPercent) / 100) : 0;
      const creditedAmount = targetRole === "agent" ? round2(amount + agentCommissionAmount) : amount;

      if (targetRole === "agent") {
        dep.type = "done";
        dep.createdDate = dep.createdDate || now;
        dep.claimDate = now;
        dep.creditedMode = "balance";
        user.balance = round2(Number(user.balance || 0) + creditedAmount);
      } else {
        dep.type = "running";
        dep.createdDate = dep.createdDate || now;
        dep.claimDate = now;
        dep.creditedMode = "plan";
      }
      await dep.save({ session });

      const tDeposit = await Transaction.create([
        {
          user: user._id,
          type: "deposit",
          status: "successful",
          amount: creditedAmount,
          note: targetRole === "agent" ? `Deposit added directly to balance: Tk${amount}${agentCommissionAmount > 0 ? ` + commission Tk${agentCommissionAmount}` : ""}` : `Deposit added successfully: ${amount}`,
          date: now,
        },
      ], { session });
      user.transactions = Array.isArray(user.transactions) ? user.transactions : [];
      user.transactions.push(tDeposit[0]._id);

      const { referralPaid, referralMessage } = await payReferralBonus({ user, amount, settings, session });
      await user.save({ session });

      result = {
        ok: true,
        targetRole,
        referralPaid,
        referralMessage,
        agentSpent: String(actorRole) === "agent" ? amount : 0,
        message:
          targetRole === "agent"
            ? (referralPaid ? `Agent deposit credited to balance (${referralMessage} referral bonus sent)` : `Agent deposit credited to balance${agentCommissionAmount > 0 ? ` (+Tk${agentCommissionAmount} commission)` : ""}`)
            : (referralPaid ? `Deposit successful (${referralMessage} referral bonus sent)` : "Deposit successful"),
      };
    });

    return result || { ok: false, message: "Approval failed" };
  } catch (error) {
    const code = String(error?.message || "APPROVAL_FAILED");
    const map = {
      DEPOSIT_NOT_FOUND: { status: 404, message: "Deposit not found" },
      ALREADY_PROCESSED: { status: 400, message: "Already processed" },
      INVALID_DEPOSIT_AMOUNT: { status: 400, message: "Invalid deposit amount" },
      USER_NOT_FOUND: { status: 404, message: "User not found" },
      USER_INACTIVE: { status: 403, message: "User inactive" },
      AGENT_NOT_FOUND: { status: 404, message: "Agent not found" },
      AGENT_INACTIVE: { status: 403, message: "Agent inactive" },
      AGENT_BALANCE_LOW: { status: 400, message: "Agent balance is too low" },
      FORBIDDEN: { status: 403, message: "Forbidden" },
    };
    const known = map[code] || { status: 500, message: "Approval failed" };
    return { ok: false, code, ...known };
  } finally {
    await session.endSession();
  }
}
