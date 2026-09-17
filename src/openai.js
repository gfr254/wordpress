import { config } from "./config.js";

const systemPrompt = `
あなたは「${config.blogTitle}」の編集者です。
空冷フォルクスワーゲン・ビートルの歴史、構造、用語、部品、文化を分かりやすく解説する日本語記事を書いてください。

必ず守るルール:
- 本文は日本語で350〜450文字程度。短すぎる説明文ではなく、基礎知識として成立させる。
- タイトルは30文字以内で、調べ物に使いやすい言葉にする。
- 本文は3〜5段落。Markdown、見出し記号、箇条書き、絵文字、画像タグは使わない。
- 筆者は現時点で空冷VWを所有していない。所有者としての体験談を書かない。
- 歴史、構造、用語について、確認できない年式、数値、仕様、由来を創作しない。
- 諸説がある場合は断定せず、確認できる範囲で説明する。
- 整備や安全に関わる内容は一般的な知識にとどめ、実作業は専門店や有資格者への相談を促す。
- 購入価格や販売車両の評価を主題にせず、必要な場合も用語や確認方法の説明にとどめる。
- 露骨な広告、アフィリエイト誘導、他サイトの転載は入れない。
- 最後は、知識を得ることで空冷VWをより深く楽しめる一文で締める。
`;

function getOutputText(data) {
  if (typeof data.output_text === "string") return data.output_text;
  const texts = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (typeof content.text === "string") texts.push(content.text);
    }
  }
  return texts.join("\n").trim();
}

function parseJson(text) {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "");
  return JSON.parse(cleaned);
}

export async function generateArticle({ dateKey, chapter, topic }) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.openaiApiKey}`,
    },
    body: JSON.stringify({
      model: config.openaiModel,
      input: [
        { role: "system", content: [{ type: "input_text", text: systemPrompt }] },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `投稿日: ${dateKey}\n章: ${chapter}\n今回のテーマ: ${topic}\nブログの補足情報: ${config.contentContext}`,
            },
          ],
        },
      ],
      max_output_tokens: 1000,
      text: {
        format: {
          type: "json_schema",
          name: "beetle_article",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              title: { type: "string" },
              body: { type: "string" },
            },
            required: ["title", "body"],
          },
        },
      },
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`OpenAI APIエラー (${response.status}): ${JSON.stringify(data)}`);
  }

  const article = parseJson(getOutputText(data));
  if (!article.title || !article.body) {
    throw new Error("OpenAIからタイトルまたは本文を取得できませんでした。");
  }

  const bodyLength = [...article.body.replace(/\s/g, "")].length;
  if (bodyLength < 280 || bodyLength > 520) {
    throw new Error(`本文が400文字程度の範囲外です（${bodyLength}文字）。`);
  }

  return {
    title: article.title.trim().slice(0, 80),
    body: article.body.trim(),
    bodyLength,
  };
}