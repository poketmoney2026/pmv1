export const DEFAULT_TUTORIAL_TITLE = "ব্যবহার নির্দেশিকা ও ভিডিও টিউটোরিয়াল";
export const DEFAULT_AGENT_TUTORIAL_TITLE = "এজেন্ট টিউটোরিয়াল ও কাজের নির্দেশিকা";

export const DEFAULT_TUTORIAL_VIDEOS = [];

const USER_SECTIONS = [
  { heading: "ড্যাশবোর্ড পেজ", content: "ড্যাশবোর্ড হলো আপনার একাউন্টের প্রধান কন্ট্রোল প্যানেল। এখানে মোট ব্যালেন্স, রানিং ডিপোজিট, রেট, প্ল্যান ও জরুরি স্ট্যাটাস দ্রুত দেখা যায়। প্রতিদিন লগইন করার পর প্রথমে এই পেজ দেখলে আপনার একাউন্টের বর্তমান অবস্থা সহজে বোঝা যায়।" },
  { heading: "লিডারবোর্ড পেজ", content: "এই পেজে শীর্ষ ব্যবহারকারী, পারফরম্যান্স বা নির্দিষ্ট র‌্যাঙ্কিং দেখা যায়। এতে নিজের অবস্থান বুঝতে সুবিধা হয় এবং আপনি অন্যদের তুলনায় কেমন করছেন তা সহজে জানা যায়।" },
  { heading: "ডিপোজিট পেজ", content: "এই পেজ থেকে নির্ধারিত মেথড অনুযায়ী টাকা যোগ করা হয়। মেথড, নাম্বার, এমাউন্ট এবং ভেরিফিকেশন সব তথ্য ঠিকভাবে পূরণ করতে হবে। ভুল তথ্য দিলে ডিপোজিট processing-এ আটকে যেতে পারে বা reject হতে পারে।" },
  { heading: "উইথড্র পেজ", content: "এই পেজ থেকে ব্যালেন্স উত্তোলনের অনুরোধ করা হয়। নাম্বার, মেথড ও এমাউন্ট সতর্কভাবে দিতে হবে। success, reject বা processing—সব status এখান থেকে বা transaction history-তে দেখা যাবে।" },
  { heading: "লাইভ সাপোর্ট পেজ", content: "এখান থেকে সরাসরি admin-এর সাথে কথা বলা যায়। কোনো সমস্যা, প্রমাণ, স্ক্রিনশট বা প্রশ্ন থাকলে এখানেই পাঠান। typing status, online status ও reply history দেখে যোগাযোগ সহজ হয়।" },
  { heading: "ব্যালেন্স বক্স পেজ", content: "এই পেজে claim, plan বা নির্ধারিত আয়-সংক্রান্ত box দেখা যায়। system-এ যতদিন set করা থাকবে, ততদিনের box দেখা যাবে। active box-এই শুধু কাজ হবে।" },
  { heading: "রেফারেল পেজ", content: "এই পেজে referral link, code, invited user এবং referral income দেখানো হয়। referral income বাড়াতে official link সঠিকভাবে share করুন।" },
  { heading: "প্রোফাইল পেজ", content: "প্রোফাইল পেজে আপনার নাম, মোবাইল নম্বর, referral code, role, status এবং প্রয়োজনীয় account তথ্য থাকে। support নেওয়ার আগে profile info ঠিক আছে কিনা দেখে নিন।" },
  { heading: "ট্রানজেকশন পেজ", content: "deposit, withdraw, gift, refund, claim, bonus ও অন্যান্য আর্থিক কার্যক্রমের history এই পেজে থাকে। কোনো সমস্যা হলে প্রথমে এই পেজ দেখুন।" },
  { heading: "ক্যালকুলেটর পেজ", content: "এই পেজে সম্ভাব্য হিসাব, আনুমানিক income বা প্রয়োজনীয় calculation সহজে বোঝা যায়। plan বোঝার আগে calculator ব্যবহার করলে সিদ্ধান্ত নেওয়া সহজ হয়।" },
  { heading: "ডাউনলোড অ্যাপ পেজ", content: "এই পেজে app, প্রয়োজনীয় resource, file বা link দেওয়া থাকতে পারে। সবসময় official source থেকেই download করুন।" },
  { heading: "কন্টাক্ট পেজ", content: "এখানে WhatsApp Contact, Telegram Contact বা অন্যান্য অফিসিয়াল যোগাযোগের মাধ্যম পাওয়া যাবে। live support ছাড়াও সরাসরি যোগাযোগের জন্য এই পেজ ব্যবহার করুন।" },
  { heading: "নোটিশ পেজ", content: "admin-এর notice, update, offer বা জরুরি বার্তা এই পেজে দেখা যায়। কিছু notice modal আকারে আসে, কিছু scrolling news আকারে দেখা যায়।" },
  { heading: "থিম পেজ", content: "এই পেজে interface-এর রং ও look পরিবর্তন করা যায়। ডার্ক বা লাইট থিম থেকে আপনার পছন্দমতো নির্বাচন করুন।" },
  { heading: "সাউন্ড পেজ", content: "এখানে click sound on/off করা যায়। switch ডানদিকে গেলে sound on এবং বামদিকে গেলে off হবে।" },
  { heading: "টিউটোরিয়াল পেজ", content: "এই পেজে প্রথমে tutorial video থাকবে, তারপর page-wise বিস্তারিত বাংলা guideline থাকবে। ভিডিও দেখে দ্রুত বুঝুন এবং নিচের section পড়ে প্রতিটি পেজের কাজ পরিষ্কারভাবে শিখুন।" },
  { heading: "অ্যাবাউট পেজ", content: "এই পেজে আমাদের টিম, কাজের ধরণ, আয় করার পদ্ধতি এবং service পরিচালনার কাঠামো বিস্তারিতভাবে দেওয়া থাকে। নতুন ব্যবহারকারীরা এই পেজ পড়ে platform সম্পর্কে বড় ধারণা পাবে।" },
];

const AGENT_SECTIONS = [
  { heading: "এজেন্ট ড্যাশবোর্ড ও কাজের পরিচিতি", content: "এজেন্ট প্যানেল মূলত deposit verify, agent deposit, agent withdraw, referral এবং live support কাজের জন্য তৈরি। সাধারণ user account-এর মতো running income এখানে চলে না।" },
  { heading: "ডিপোজিট ভেরিফাই পেজ", content: "user-এর processing deposit এখানে দেখা যাবে। agent success করতে পারবে, কিন্তু cancel বা reject করতে পারবে না। success করলে agent balance থেকে amount কাটা হবে এবং balance কম থাকলে success হবে না।" },
  { heading: "এজেন্ট ডিপোজিট পেজ", content: "এজেন্ট নিজের balance add করার জন্য এই পেজ ব্যবহার করবে। admin method অনুযায়ী minimum amount set করলে তার কমে request করা যাবে না। success হলে plan চালু হবে না; amount সরাসরি balance-এ credit হবে, commission থাকলে তা-ও যোগ হবে।" },
  { heading: "এজেন্ট উইথড্র পেজ", content: "এজেন্ট নিজের balance withdraw করতে পারবে। user-এর মতোই method, number এবং amount সঠিকভাবে দিতে হবে।" },
  { heading: "এজেন্ট ট্রানজেকশন পেজ", content: "এখানে agent-এর নিজের deposit, withdraw, referral income এবং user deposit success করার কারণে balance কাটার history দেখা যাবে।" },
  { heading: "এজেন্ট রেফারেল পেজ", content: "referral income user-এর মতোই কাজ করবে। valid referral হলে income যোগ হবে।" },
  { heading: "এজেন্ট প্রোফাইল / নোটিশ / থিম / সাউন্ড / ডাউনলোড / লাইভ সাপোর্ট", content: "এই page-গুলো সাধারণ user-এর মতো হলেও কাজের context agent role অনুযায়ী আলাদা হতে পারে। কোনো জটিলতা হলে live support-এ admin-এর সাথে কথা বলুন।" },
];

export function normalizeAudience(value) {
  const v = String(value || "user").toLowerCase();
  return v === "agent" ? "agent" : "user";
}

export function getDefaultTutorialTitle(audience = "user") {
  return normalizeAudience(audience) === "agent" ? DEFAULT_AGENT_TUTORIAL_TITLE : DEFAULT_TUTORIAL_TITLE;
}

export function getDefaultTutorialSections(audience = "user") {
  const source = normalizeAudience(audience) === "agent" ? AGENT_SECTIONS : USER_SECTIONS;
  return source.map((item, index) => ({ ...item, order: index + 1, isActive: true }));
}

export function sectionsToText(sections = []) {
  return (sections || [])
    .filter((item) => String(item?.heading || "").trim() || String(item?.content || "").trim())
    .map((item) => `${String(item?.heading || "").trim()}\n- ${String(item?.content || "").trim()}`)
    .join("\n\n")
    .trim();
}

export function getDefaultTutorialText(audience = "user") {
  return sectionsToText(getDefaultTutorialSections(audience));
}

export function parseTutorialSections(text) {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim());
  const sections = [];
  let current = null;
  for (const line of lines) {
    if (!line) {
      if (current && (current.heading || current.content)) {
        sections.push(current);
        current = null;
      }
      continue;
    }
    const bullet = /^[•\-*]\s+/.test(line);
    if (!current || (!bullet && current.content)) {
      if (current && (current.heading || current.content)) sections.push(current);
      current = { heading: line.replace(/^[#]+\s*/, "").trim(), content: "", order: sections.length + 1, isActive: true };
      continue;
    }
    current.content = [current.content, line.replace(/^[•\-*]\s+/, "").trim()].filter(Boolean).join(" ").trim();
  }
  if (current && (current.heading || current.content)) sections.push(current);
  return sections.filter((s) => s.heading || s.content);
}