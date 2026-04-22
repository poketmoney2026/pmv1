import Transaction from "@/models/Transaction";
import Deposit from "@/models/Deposit";
import Withdraw from "@/models/Withdraw";

export function paymentMethodLabel(method) {
  const value = String(method || "").toLowerCase();
  if (value === "bkash") return "bKash";
  if (value === "nagad") return "Nagad";
  if (value === "rocket") return "Rocket";
  if (value === "upay") return "Upay";
  if (value === "recharge") return "Mobile Recharge";
  return String(method || "").toUpperCase();
}

export function accountTypeLabel(type) {
  const value = String(type || "").toLowerCase();
  if (value === "personal") return "Personal";
  if (value === "agent") return "Agent";
  if (value === "merchant") return "Merchant";
  if (value === "gp") return "Grameenphone";
  if (value === "bl") return "Banglalink";
  if (value === "robi") return "Robi";
  if (value === "airtel") return "Airtel";
  if (value === "teletalk") return "Teletalk";
  return String(type || "").toUpperCase();
}

export function normalizeStatus(status) {
  const value = String(status || "").toLowerCase();
  if (value === "success") return "successful";
  if (value === "rejected") return "reject";
  return value;
}

function fmtDate(value) {
  const d = value ? new Date(value) : null;
  return d && !Number.isNaN(d.getTime()) ? d.toISOString() : null;
}

function mapTransaction(row) {
  return {
    id: `tx_${row._id}`,
    entityId: String(row._id),
    source: "ledger",
    type: row.type,
    status: normalizeStatus(row.status || "successful"),
    amount: Number(row.amount || 0),
    note: row.note || "",
    createdAt: fmtDate(row.date || row.createdAt),
    method: "",
    methodLabel: "",
    accountType: "",
    accountTypeLabel: "",
    verifyMode: "",
    mobileRef: "",
    user: row.user
      ? {
          id: String(row.user._id || ""),
          fullName: row.user.fullName || "",
          mobile: row.user.mobile || "",
        }
      : null,
  };
}

function mapDeposit(row) {
  return {
    id: `deposit_${row._id}`,
    entityId: String(row._id),
    source: "deposit",
    type: "deposit",
    status: normalizeStatus(row.status || "processing"),
    amount: Number(row.amount || 0),
    note: row.note || "",
    createdAt: fmtDate(row.createdAt),
    method: row.paymentMethod || "",
    methodLabel: paymentMethodLabel(row.paymentMethod),
    accountType: "",
    accountTypeLabel: "",
    verifyMode: row.verifyMode || "",
    mobileRef: row.senderNumber || row.trxId || "",
    user: row.userId
      ? {
          id: String(row.userId._id || ""),
          fullName: row.userId.fullName || "",
          mobile: row.userId.mobile || "",
        }
      : null,
  };
}

function mapWithdraw(row) {
  return {
    id: `withdraw_${row._id}`,
    entityId: String(row._id),
    source: "withdraw",
    type: "withdraw",
    status: normalizeStatus(row.status || "pending"),
    amount: Number(row.amount || 0),
    note: row.note || "",
    createdAt: fmtDate(row.date || row.createdAt),
    method: row.paymentMethod || "",
    methodLabel: paymentMethodLabel(row.paymentMethod),
    accountType: row.accountType || "",
    accountTypeLabel: accountTypeLabel(row.accountType),
    verifyMode: "",
    mobileRef: row.mobile || "",
    user: row.userId
      ? {
          id: String(row.userId._id || ""),
          fullName: row.userId.fullName || "",
          mobile: row.userId.mobile || "",
        }
      : null,
  };
}

function rowMatches(row, { q = "", type = "", status = "", source = "", userId = "" }) {
  const query = String(q || "").trim().toLowerCase();
  const wantedType = String(type || "").trim().toLowerCase();
  const wantedStatus = normalizeStatus(status || "");
  const wantedSource = String(source || "").trim().toLowerCase();
  const wantedUserId = String(userId || "").trim();

  if (wantedSource && row.source !== wantedSource) return false;
  if (wantedType && String(row.type || "").toLowerCase() !== wantedType) return false;
  if (wantedStatus && String(row.status || "").toLowerCase() !== wantedStatus) return false;
  if (wantedUserId && String(row.user?.id || "") !== wantedUserId) return false;
  if (!query) return true;

  const hay = [
    row.type,
    row.status,
    row.source,
    row.note,
    row.method,
    row.methodLabel,
    row.accountType,
    row.accountTypeLabel,
    row.verifyMode,
    row.mobileRef,
    row.user?.fullName,
    row.user?.mobile,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return hay.includes(query);
}

export async function loadAdminTransactions({ q = "", type = "", status = "", source = "", userId = "", limit = 50, offset = 0 } = {}) {
  const [ledgerRows, depositRows, withdrawRows] = await Promise.all([
    Transaction.find({ type: { $nin: ["deposit", "withdraw"] } })
      .populate("user", "fullName mobile")
      .sort({ date: -1, createdAt: -1 })
      .limit(Math.max(120, Number(limit || 300)))
      .lean(),
    Deposit.find({})
      .populate("userId", "fullName mobile")
      .sort({ createdAt: -1 })
      .limit(Math.max(120, Number(limit || 300)))
      .lean(),
    Withdraw.find({})
      .populate("userId", "fullName mobile")
      .sort({ date: -1, createdAt: -1 })
      .limit(Math.max(120, Number(limit || 300)))
      .lean(),
  ]);

  const rows = [
    ...ledgerRows.map(mapTransaction),
    ...depositRows.map(mapDeposit),
    ...withdrawRows.map(mapWithdraw),
  ]
    .filter((row) => rowMatches(row, { q, type, status, source, userId }))
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(Math.max(0, Number(offset || 0)), Math.max(0, Number(offset || 0)) + Math.max(1, Number(limit || 50)));

  const types = Array.from(new Set(rows.map((row) => String(row.type || "").toLowerCase()).filter(Boolean))).sort();
  const statuses = Array.from(new Set(rows.map((row) => String(row.status || "").toLowerCase()).filter(Boolean))).sort();
  const sources = Array.from(new Set(rows.map((row) => String(row.source || "").toLowerCase()).filter(Boolean))).sort();

  return { rows, total: [...ledgerRows.map(mapTransaction), ...depositRows.map(mapDeposit), ...withdrawRows.map(mapWithdraw)].filter((row) => rowMatches(row, { q, type, status, source, userId })).length, facets: { types, statuses, sources } };
}
