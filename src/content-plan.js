const topics = [
  ["歴史", "フォルクスワーゲン・ビートルの誕生と歴史"],
  ["歴史", "タイプ1と呼ばれる理由"],
  ["歴史", "ビートルの世代と年式の見分け方"],
  ["歴史", "日本で空冷VWが愛されてきた背景"],
  ["用語", "空冷エンジンの基本構造"],
  ["用語", "キャブレターとは何か"],
  ["用語", "点火系の基本を知る"],
  ["用語", "ファンシュラウドと冷却の仕組み"],
  ["用語", "ビートルの型式と呼び方"],
  ["部品", "ジェネレーターとオルタネーターの違い"],
  ["部品", "空冷VWのブレーキ部品を知る"],
  ["部品", "エンジンオイルの役割"],
  ["部品", "純正部品と社外部品の考え方"],
  ["部品", "消耗品の交換時期を考える方法"],
  ["基礎知識", "空冷と水冷の違い"],
  ["基礎知識", "旧車の維持管理で大切な記録"],
  ["基礎知識", "車検と日常点検の違い"],
  ["基礎知識", "旧車の安全確認を専門家に相談する理由"],
  ["文化", "ビートルのデザインが長く支持される理由"],
  ["文化", "空冷VWとカスタム文化"],
  ["文化", "フォルクスワーゲンの広告と大衆車文化"],
  ["文化", "空冷VWイベントの楽しみ方"],
  ["購入知識", "販売ページで見かける空冷VW用語"],
  ["購入知識", "年式を調べるときの注意点"],
  ["購入知識", "整備履歴を読むための基礎用語"],
  ["購入知識", "専門店へ相談する前に整理したい情報"],
  ["写真で学ぶ", "写真から分かるビートルの装備"],
  ["写真で学ぶ", "エンジンルームを見るときの基本用語"],
  ["写真で学ぶ", "内装から考える年式の違い"],
  ["写真で学ぶ", "旧車写真を記録するときのポイント"]
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

function categoryKeyForTopic(chapter, topic) {
  if (chapter === "歴史") return "historyCulture";
  if (chapter === "用語") return "structureTerms";
  if (chapter === "部品") return "maintenance";
  if (chapter === "購入知識") return "buyingGuide";
  if (chapter === "文化") {
    if (/カスタム/.test(topic)) return "custom";
    if (/イベント/.test(topic)) return "eventsLife";
    return "historyCulture";
  }
  if (chapter === "基礎知識") {
    if (/維持|記録|車検|点検|安全/.test(topic)) return "maintenance";
    return "structureTerms";
  }
  if (chapter === "写真で学ぶ") {
    if (/年式/.test(topic)) return "buyingGuide";
    return "structureTerms";
  }
  return "historyCulture";
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
    categoryKey: categoryKeyForTopic(chapter, topic),
    slug: `beetle-life-${dateKey}`
  };
}
