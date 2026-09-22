import { config } from "./config.js";

const monetizedChapters = new Set(["部品", "用語", "購入知識"]);
const endpoint = "https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601";

function imageUrl(item) {
  const images = item.mediumImageUrls || item.smallImageUrls || [];
  const first = Array.isArray(images) ? images[0] : null;
  return typeof first === "string" ? first : first?.imageUrl || "";
}

function normalizeItem(entry) {
  const item = entry?.Item || entry;
  const url = item?.affiliateUrl || item?.itemUrl || "";
  if (!item?.itemName || !/^https:\/\//i.test(url)) return null;

  const image = imageUrl(item);
  return {
    name: String(item.itemName).trim(),
    price: Number.isFinite(Number(item.itemPrice)) ? Number(item.itemPrice) : null,
    url,
    image: /^https:\/\//i.test(image) ? image : "",
    shop: String(item.shopName || "楽天市場").trim(),
  };
}

export async function buildRakutenAffiliate({ chapter, topic }) {
  if (
    !config.rakutenApplicationId ||
    !config.rakutenAffiliateId ||
    !monetizedChapters.has(chapter)
  ) {
    return null;
  }

  const keyword = (config.rakutenKeywordPrefix + " " + topic).trim();
  const url = new URL(endpoint);
  url.searchParams.set("applicationId", config.rakutenApplicationId);
  url.searchParams.set("affiliateId", config.rakutenAffiliateId);
  url.searchParams.set("keyword", keyword);
  url.searchParams.set("hits", String(config.rakutenMaxItems));
  url.searchParams.set("formatVersion", "2");
  url.searchParams.set("imageFlag", "1");

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error("楽天APIエラー (" + response.status + "): " + JSON.stringify(data));
  }

  const products = (Array.isArray(data?.Items) ? data.Items : [])
    .map(normalizeItem)
    .filter(Boolean)
    .slice(0, config.rakutenMaxItems);

  if (products.length === 0) return null;

  return {
    keyword,
    products,
    disclosure: "この記事には楽天アフィリエイト広告が含まれています。",
  };
}
