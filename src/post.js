import { config } from "./config.js";
import { getTodayContext } from "./content-plan.js";
import { generateArticle } from "./openai.js";
import { publishArticle } from "./wordpress.js";
import { buildAmazonAffiliate } from "./amazon.js";
import { buildRakutenAffiliate } from "./rakuten.js";

async function main() {
  const context = getTodayContext();
  console.log(
    `[${context.dateKey}] ${context.chapter} / ${context.topic} の記事を生成します。`,
  );

  const article = await generateArticle(context);
  console.log(`生成完了: ${article.title}（本文${article.bodyLength}文字）`);

  const affiliate = buildAmazonAffiliate({
    chapter: context.chapter,
    topic: context.topic,
  });
  if (affiliate) {
    console.log("Amazonリンクを追加します: " + affiliate.keyword);
  }

  let rakuten = null;
  try {
    rakuten = await buildRakutenAffiliate({
      chapter: context.chapter,
      topic: context.topic,
    });
    if (rakuten) {
      console.log(`楽天リンクを追加します: ${rakuten.keyword}（${rakuten.products.length}件）`);
    }
  } catch (error) {
    console.warn("楽天商品検索をスキップしました: " + (error instanceof Error ? error.message : error));
  }

  const result = await publishArticle({
    slug: context.slug,
    title: article.title,
    body: article.body,
    affiliate,
    rakuten,
  });

  if (result.skipped) {
    console.log(`同日の記事がすでに存在するためスキップしました: ${result.post.link}`);
    return;
  }

  console.log(
    `WordPressへ${config.wpStatus === "publish" ? "公開" : "投稿"}しました: ${result.post.link}`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});