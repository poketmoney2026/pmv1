// app/api/user/withdraw-meta/route.js
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import GeneralSettings from "@/models/GeneralSettings";
import Withdraw from "@/models/Withdraw";
import { getUserIdFromToken } from "@/lib/auth";

function round2(n){return Number(Number(n||0).toFixed(2));}
function clamp0(n){const x=Number(n||0);if(!Number.isFinite(x))return 0;return x<0?0:x;}
function sec(n){return Math.max(0,Math.floor(Number(n||0)));}

export async function GET(){
  const uid=await getUserIdFromToken();
  if(!uid) return NextResponse.json({ok:false,message:"Unauthorized"},{status:401});
  await dbConnect();
  const s=await GeneralSettings.findOne({key:"global"}).lean();
  const now=new Date();
  const since=new Date(now.getTime()-24*60*60*1000);
  const userObjId=new mongoose.Types.ObjectId(uid);

  const agg=await Withdraw.aggregate([
    {$match:{userId:userObjId,status:{$in:["pending","successful"]},date:{$gte:since}}},
    {$group:{_id:null,totalAmount:{$sum:"$amount"},totalCount:{$sum:1},oldest:{$min:"$date"}}}
  ]);

  const usedWithdrawAmount24h=round2(Number(agg?.[0]?.totalAmount||0));
  const usedWithdrawCount24h=Number(agg?.[0]?.totalCount||0);
  const oldest=agg?.[0]?.oldest?new Date(agg[0].oldest):null;
  const resetAt=oldest?new Date(oldest.getTime()+24*60*60*1000):null;
  const retryAfterSec=oldest?sec((resetAt.getTime()-now.getTime())/1000):0;

  const res=NextResponse.json({
    ok:true,
    data:{
      withdrawFee:clamp0(s?.withdrawFee??0),
      minWithdraw:clamp0(s?.minWithdraw??0),
      maxWithdraw:s?.maxWithdraw===null||s?.maxWithdraw===undefined?null:clamp0(s.maxWithdraw),
      rechargeMinWithdraw:clamp0(s?.rechargeMinWithdraw??20),
      rechargeMaxWithdraw:s?.rechargeMaxWithdraw===null||s?.rechargeMaxWithdraw===undefined?null:clamp0(s.rechargeMaxWithdraw),
      dailyWithdrawLimit:s?.dailyWithdrawLimit===null||s?.dailyWithdrawLimit===undefined?null:Math.floor(clamp0(s.dailyWithdrawLimit)),
      dailyAmountLimit:s?.dailyAmountLimit===null||s?.dailyAmountLimit===undefined?null:round2(clamp0(s.dailyAmountLimit)),
      etaText:"5–30 minutes",
      usedWithdrawAmount24h,
      usedWithdrawCount24h,
      retryAfterSec,
      resetAt:resetAt?resetAt.toISOString():null,
      methodLimits:{
        bkash:{min:clamp0(s?.minWithdraw??0),max:s?.maxWithdraw===null||s?.maxWithdraw===undefined?null:clamp0(s.maxWithdraw)},
        nagad:{min:clamp0(s?.minWithdraw??0),max:s?.maxWithdraw===null||s?.maxWithdraw===undefined?null:clamp0(s.maxWithdraw)},
        recharge:{min:clamp0(s?.rechargeMinWithdraw??20),max:s?.rechargeMaxWithdraw===null||s?.rechargeMaxWithdraw===undefined?null:clamp0(s.rechargeMaxWithdraw)}
      },
      countProgress:s?.dailyWithdrawLimit===null||s?.dailyWithdrawLimit===undefined?null:Math.max(0,Math.min(100,(usedWithdrawCount24h/Math.max(1,Number(s.dailyWithdrawLimit)))*100)),
      amountProgress:s?.dailyAmountLimit===null||s?.dailyAmountLimit===undefined?null:Math.max(0,Math.min(100,(usedWithdrawAmount24h/Math.max(1,Number(s.dailyAmountLimit)))*100))
    }
  },{status:200});

  res.headers.set("Cache-Control","no-store, no-cache, must-revalidate, proxy-revalidate");
  res.headers.set("Pragma","no-cache");
  res.headers.set("Expires","0");
  return res;
}
