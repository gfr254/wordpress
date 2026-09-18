import { config } from "./config.js";

const monetizedChapters = new Set(["部品", "用語", "購入知識"]);

export function buildAmazonAffiliate({ chapter, topic }) {
  if (!config.amazonAssociateTag || !monetizedChapters.has(chapter)) return null;

  const keyword = (config.amazonKeywordPrefix + " " + topic).trim();
  const url = new URL("https://www.amazon.co.jp/s");
  url.searchParams.set("k", keyword);
  url.searchParams.set("tag", config.amazonAssociateTag);

  return {
    keyword,
    url: url.toString(),
    disclosure: "この記事にはAmazonアソシエイトリンクが含まれています。",
    label: "Amazonで「" + keyword + "」を探す",
  };
}
