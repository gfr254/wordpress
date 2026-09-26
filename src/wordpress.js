import { config } from "./config.js";

const authHeader = `Basic ${Buffer.from(
  `${config.wpUsername}:${config.wpAppPassword}`,
).toString("base64")}`;

async function wpRequest(path, options = {}) {
  const response = await fetch(`${config.wpUrl}/wp-json/wp/v2${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: authHeader,
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!response.ok) {
    throw new Error(`WordPress APIエラー (${response.status}): ${JSON.stringify(data)}`);
  }
  return data;
}

const categoryDefinitions = {
  historyCulture: { name: "歴史・文化", slug: "history-culture" },
  structureTerms: { name: "構造・用語", slug: "structure-terms" },
  maintenance: { name: "整備・維持", slug: "maintenance" },
  eventsLife: { name: "イベント・暮らし", slug: "events-life" },
  custom: { name: "カスタム", slug: "custom" },
  buyingGuide: { name: "購入ガイド", slug: "buying-guide" },
};

const categoryIdCache = new Map();

async function getOrCreateCategory(categoryKey) {
  const definition = categoryDefinitions[categoryKey] || categoryDefinitions.structureTerms;
  if (categoryIdCache.has(definition.slug)) return categoryIdCache.get(definition.slug);

  const existing = await wpRequest(
    "/categories?slug=" + encodeURIComponent(definition.slug) + "&_fields=id,slug",
  );
  if (Array.isArray(existing) && existing.length > 0) {
    const id = Number(existing[0].id);
    categoryIdCache.set(definition.slug, id);
    return id;
  }

  const created = await wpRequest("/categories", {
    method: "POST",
    body: JSON.stringify(definition),
  });
  const id = Number(created.id);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("WordPressカテゴリの作成結果からIDを取得できませんでした。");
  }
  categoryIdCache.set(definition.slug, id);
  return id;
}

function classifyExistingPost(title) {
  const text = String(title || "").normalize("NFKC");
  if (/販売|購入|買い|選び方|年式/.test(text)) return "buyingGuide";
  if (/イベント|旅行|旅/.test(text)) return "eventsLife";
  if (/カスタム/.test(text)) return "custom";
  if (/故障|トラブル|維持|メンテナンス|車検|点検|安全|記録|整備|オイル漏れ|交換/.test(text)) return "maintenance";
  if (/構造|用語|仕組み|違い|エンジン|冷却|キャブレター|点火|型式/.test(text)) return "structureTerms";
  return "historyCulture";
}

export async function recategorizeUncategorizedPosts() {
  const defaultCategories = await wpRequest(
    "/categories?slug=uncategorized&_fields=id,slug",
  );
  if (!Array.isArray(defaultCategories) || defaultCategories.length === 0) return 0;

  const uncategorizedId = Number(defaultCategories[0].id);
  const posts = [];
  let page = 1;
  while (true) {
    const batch = await wpRequest(
      "/posts?categories=" + uncategorizedId + "&per_page=100&page=" + page + "&_fields=id,title,categories",
    );
    if (!Array.isArray(batch) || batch.length === 0) break;
    posts.push(...batch);
    if (batch.length < 100) break;
    page += 1;
  }

  let updatedCount = 0;
  for (const post of posts) {
    const categoryId = await getOrCreateCategory(classifyExistingPost(post.title?.rendered));
    const currentIds = (post.categories || []).filter((id) => Number(id) !== uncategorizedId);
    const nextIds = Array.from(new Set([...currentIds, categoryId]));
    if (currentIds.length === nextIds.length && currentIds.every((id, index) => id === nextIds[index])) continue;
    await wpRequest("/posts/" + post.id, {
      method: "POST",
      body: JSON.stringify({ categories: nextIds }),
    });
    updatedCount += 1;
  }
  return updatedCount;
}

function toHtmlParagraphs(body) {
  return body
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br>")}</p>`)
    .join("\n");
}

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;");
}

function toAffiliateHtml({ amazon, rakuten }) {
  const blocks = [];
  if (amazon) {
    blocks.push(
      "<p class=\"amazon-affiliate-disclosure\">" + escapeHtml(amazon.disclosure) + "</p>",
      "<p class=\"amazon-affiliate-link\"><a href=\"" + escapeHtml(amazon.url) + "\" rel=\"nofollow sponsored noopener\" target=\"_blank\">" + escapeHtml(amazon.label) + "</a></p>",
    );
  }
  if (rakuten) {
    blocks.push(
      "<p class=\"rakuten-affiliate-disclosure\">" + escapeHtml(rakuten.disclosure) + "</p>",
      "<section class=\"rakuten-products\" aria-label=\"楽天おすすめ商品\">",
      "<h2>関連する楽天市場の商品</h2>",
      rakuten.products.map((product) => {
        const image = product.image
          ? "<img src=\"" + escapeHtml(product.image) + "\" alt=\"" + escapeHtml(product.name) + "\" loading=\"lazy\">"
          : "";
        const price = product.price === null
          ? ""
          : "<span class=\"rakuten-product-price\">" + product.price.toLocaleString("ja-JP") + "円</span>";
        return "<article class=\"rakuten-product\">" + image + "<div><h3>" + escapeHtml(product.name) + "</h3>" + price + "<p class=\"rakuten-product-shop\">" + escapeHtml(product.shop) + "</p><a href=\"" + escapeHtml(product.url) + "\" rel=\"nofollow sponsored noopener\" target=\"_blank\">楽天市場で見る</a></div></article>";
      }).join(String.fromCharCode(10)),
      "</section>",
    );
  }
  return blocks.join(String.fromCharCode(10));
}
export async function publishArticle({ slug, title, body, categoryKey, affiliate, rakuten }) {
  const existing = await wpRequest(
    `/posts?slug=${encodeURIComponent(slug)}&_fields=id,link,slug`,
  );
  if (Array.isArray(existing) && existing.length > 0) {
    return { skipped: true, post: existing[0] };
  }

  const payload = {
    title,
    content: [toHtmlParagraphs(body), toAffiliateHtml({ amazon: affiliate, rakuten })].filter(Boolean).join(String.fromCharCode(10)),
    slug,
    status: config.wpStatus,
    excerpt: body.replace(/\s+/g, " ").slice(0, 120),
  };
  payload.categories = [await getOrCreateCategory(categoryKey)];

  const post = await wpRequest("/posts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return { skipped: false, post };
}