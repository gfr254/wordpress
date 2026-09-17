const topics = [
  ["購入前", "空冷ビートルを買う前に最初に調べること"],
  ["購入前", "車両価格以外に必要になる費用"],
  ["購入前", "現車確認で見るべきポイント"],
  ["購入前", "空冷ビートルの年式と仕様の違い"],
  ["購入前", "専門店と個人売買の違い"],
  ["購入前", "購入を急がないほうがよいケース"],
  ["購入前", "初めての空冷VWに向いている人"],
  ["購入前", "家族に空冷ビートルを説明するときのポイント"],
  ["維持費", "空冷ビートルの年間維持費を考える"],
  ["維持費", "車検以外に考えておきたい費用"],
  ["維持費", "部品代と工賃を調べるときの注意点"],
  ["維持費", "旧車の保険と駐車場について考える"],
  ["故障と整備", "空冷ビートルの故障情報を調べる方法"],
  ["故障と整備", "購入前に専門店へ確認したい整備履歴"],
  ["故障と整備", "オイル漏れについて購入前に知っておくこと"],
  ["故障と整備", "夏の空冷エンジン対策を調べる"],
  ["故障と整備", "DIY整備を始める前に考える安全面"],
  ["故障と整備", "部品交換を専門店に相談する基準"],
  ["オーナーの声", "空冷ビートルのオーナーに聞きたい質問"],
  ["オーナーの声", "購入後に困ったことを体験談から学ぶ"],
  ["オーナーの声", "空冷VWオーナーが大切にしていること"],
  ["オーナーの声", "旧車に乗る人の維持管理方法"],
  ["旅と文化", "空冷ビートルで出かける前の準備"],
  ["旅と文化", "旧車イベントで確認したいポイント"],
  ["旅と文化", "空冷VWの歴史を購入前に知る"],
  ["旅と文化", "ビートルが長く愛される理由"],
  ["これから", "空冷ビートルを買う前の予算計画"],
  ["これから", "購入を決める前に整理したい条件"],
  ["これから", "買わないという選択も含めて考える"],
  ["これから", "未来の空冷VWオーナーに伝えたい確認事項"]
];

function tokyoDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);

  return Object.fromEntries(
    parts
      .filter(({ type }) => type !== "literal")
      .map(({ type, value }) => [type, value])
  );
}

export function getTodayContext(date = new Date()) {
  const { year, month, day } = tokyoDateParts(date);
  const dateKey = `${year}-${month}-${day}`;
  const dayNumber = Math.floor(
    Date.UTC(Number(year), Number(month) - 1, Number(day)) / 86400000
  );
  const [chapter, topic] = topics[Math.abs(dayNumber) % topics.length];

  return {
    dateKey,
    chapter,
    topic,
    slug: `beetle-life-${dateKey}`
  };
}
