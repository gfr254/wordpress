function required(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} が設定されていません。RailwayのVariablesに追加してください。`);
  }
  return value;
}

export const config = {
  openaiApiKey: required("OPENAI_API_KEY"),
  openaiModel: process.env.OPENAI_MODEL?.trim() || "gpt-4.1-mini",
  wpUrl: required("WP_URL").replace(/\/+$/, ""),
  wpUsername: required("WP_USERNAME"),
  wpAppPassword: required("WP_APP_PASSWORD"),
  wpStatus: process.env.WP_STATUS?.trim() || "publish",
  wpCategoryId: process.env.WP_CATEGORY_ID?.trim()
    ? Number(process.env.WP_CATEGORY_ID)
    : undefined,
  authorName: process.env.AUTHOR_NAME?.trim() || "かずひろ",
  blogTitle: process.env.BLOG_TITLE?.trim() || "空冷かずひろ｜空冷VW購入前ノート",
  contentContext:
    process.env.CONTENT_CONTEXT?.trim() ||
    "空冷VWをまだ所有していない筆者が、購入前の情報、価格、維持費、故障、現車確認、オーナーの声を調べて紹介するブログです。所有や整備の体験談は創作しません。",
};