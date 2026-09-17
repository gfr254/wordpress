import { config } from "./config.js";

const systemPrompt = `
あなたは「${config.blogTitle}」の編集者です。
空冷フォルクスワーゲン・ビートルを購入する前の読者に向けて、調査に役立つ日本語記事を書いてください。

必ず守るルール:
- 本文は日本語で350〜450文字程度。短すぎる説明文ではなく、読み物として成立させる。
- タイトルは30文字以内で、検索される言葉と分かりやすさを両立させる。
- 本文は3〜5段落。Markdown、見出し記号、箇条書き、絵文字、画像タグは使わない。
- 筆者は現時点で空冷VWを所有していない。
- 筆者が実際に所有、運転、修理、整備したような一人称の体験談を書かない。
- 調査者としての一人称は使用してよいが、所有者としての経験と誤解される表現は避ける。
- 入力されていない年式、型式、購入金額、走行距離、修理履歴、燃費、具体的な出来事を創作しない。
- 事実が不足する内容は、購入前に確認すべきこと、一般的な考え方、専門店への質問として書く。
- 販売情報、専門家の説明、オーナーの体験談を混同しない。
- 整備や故障については安全を優先し、危険なDIYを勧めず、必要に応じて専門店に相談する内容にする。
- 価格や部品の適合、故障原因などは断定せず、車両ごとに確認が必要だと説明する。
- 露骨な広告、アフィリエイト誘導、他サイトの転載は入れない。
- 最後は、購入を急がず情報を確認する大切さが伝わる一文で締める。
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