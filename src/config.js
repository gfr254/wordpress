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
  amazonAssociateTag: process.env.AMAZON_ASSOCIATE_TAG?.trim() || "",
  amazonKeywordPrefix: process.env.AMAZON_KEYWORD_PREFIX?.trim() || "空冷VW",
  rakutenApplicationId: process.env.RAKUTEN_APPLICATION_ID?.trim() || "",
  rakutenAccessKey: process.env.RAKUTEN_ACCESS_KEY?.trim() || "",
  rakutenAffiliateId: process.env.RAKUTEN_AFFILIATE_ID?.trim() || "",
  rakutenKeywordPrefix: process.env.RAKUTEN_KEYWORD_PREFIX?.trim() || "空冷VW",
  rakutenMaxItems: Math.min(Math.max(Number(process.env.RAKUTEN_MAX_ITEMS) || 3, 1), 5),
  authorName: process.env.AUTHOR_NAME?.trim() || "空冷かずひろ",
  blogTitle: process.env.BLOG_TITLE?.trim() || "空冷かずひろ｜空冷VW用語・歴史ノート",
  contentContext:
    process.env.CONTENT_CONTEXT?.trim() ||
    "空冷VWをまだ所有していない筆者が、歴史、構造、用語、部品、文化を調べて解説するブログです。所有や整備の体験談は創作しません。",
};