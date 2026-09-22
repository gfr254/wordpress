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
export async function publishArticle({ slug, title, body, affiliate, rakuten }) {
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
  if (Number.isInteger(config.wpCategoryId) && config.wpCategoryId > 0) {
    payload.categories = [config.wpCategoryId];
  }

  const post = await wpRequest("/posts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return { skipped: false, post };
}