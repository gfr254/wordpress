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

export async function publishArticle({ slug, title, body }) {
  const existing = await wpRequest(
    `/posts?slug=${encodeURIComponent(slug)}&_fields=id,link,slug`,
  );
  if (Array.isArray(existing) && existing.length > 0) {
    return { skipped: true, post: existing[0] };
  }

  const payload = {
    title,
    content: toHtmlParagraphs(body),
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