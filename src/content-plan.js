const topics = [
  ["出会い", "空冷ビートルを買った理由"],
  ["出会い", "納車の日に感じたこと"],
  ["出会い", "購入前に不安だったこと"],
  ["出会い", "なぜ新しい車ではなくビートルなのか"],
  ["暮らし", "ビートルのある休日ルーティン"],
  ["暮らし", "コンビニまでの短いドライブが楽しい理由"],
  ["暮らし", "雨の日の空冷ビートル"],
  ["暮らし", "ガレージで過ごす時間"],
  ["暮らし", "通勤で感じる古い車の魅力"],
  ["故障と整備", "初めてのエンジントラブルに備える"],
  ["故障と整備", "オイル漏れと上手に付き合う"],
  ["故障と整備", "最初に覚えたいDIYメンテナンス"],
  ["故障と整備", "空冷ビートルの年間維持費を考える"],
  ["故障と整備", "故障を嫌いになれない理由"],
  ["ドライブ", "群馬で走りたいのんびりドライブコース"],
  ["ドライブ", "榛名湖までの日帰りドライブ"],
  ["ドライブ", "軽井沢へ向かう道中の楽しみ"],
  ["ドライブ", "道の駅を目的地にする旅"],
  ["ドライブ", "目的地より道中が楽しい理由"],
  ["仲間", "初めてVWミーティングに参加するとき"],
  ["仲間", "イベント会場で生まれる会話"],
  ["仲間", "同じビートルに乗る人との出会い"],
  ["仲間", "仲間と走るツーリングの魅力"],
  ["仲間", "オーナー同士で共有したい情報"],
  ["これから", "10年後も乗り続けたい理由"],
  ["これから", "部品供給と長く乗るための準備"],
  ["これから", "未来のビートルオーナーへ伝えたいこと"],
  ["これから", "家族との思い出を増やす車"],
  ["これから", "ビートルと人生を歩くということ"],
  ["これから", "古い車と暮らして変わったこと"],
];

function tokyoDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  return Object.fromEntries(
    parts
      .filter(({ type }) => type !== "literal")
      .map(({ type, value }) => [type, value]),
  );
}

export function getTodayContext(date = new Date()) {
  const { year, month, day } = tokyoDateParts(date);
  const dateKey = `${year}-${month}-${day}`;
  const dayNumber = Math.floor(
    Date.UTC(Number(year), Number(month) - 1, Number(day)) / 86400000,
  );
  const [chapter, topic] = topics[Math.abs(dayNumber) % topics.length];

  return {
    dateKey,
    chapter,
    topic,
    slug: `beetle-life-${dateKey}`,
  };
}