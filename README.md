# かずひろビートル 自動投稿

空冷ビートルとの暮らしをテーマに、OpenAIで1日1記事（本文350〜450文字程度）を生成し、WordPress REST APIへ画像なしで投稿するスクリプトです。

このリポジトリでは、WordPress本体と自動投稿Cronを別サービスとしてRailwayに配置します。WordPress本体のDocker設定は `wordpress/` にあります。

## 構成

- **GitHub**: ソースコードを管理
- **OpenAI**: 記事タイトルと本文を生成
- **Railway**: WordPress Webサービスと、毎日1回動く自動投稿Cronを実行
- **Cloudflare**: `kazuhiro-beetle.com` のDNS・SSLを管理
- **WordPress**: REST API経由で記事を公開

## Railwayへの設定

自動投稿用Cronサービスを作る場合:

1. RailwayでこのGitHubリポジトリからサービスを作成する。
2. Variablesに `.env.example` の項目を登録する。
3. Service SettingsのStart Commandを `npm run post` にする。
4. Cron Scheduleを `0 0 * * *` にする。

WordPress本体をRailwayに作る手順は [`wordpress/README.md`](wordpress/README.md) を参照してください。WordPress本体のサービスにはCustom Domainを設定し、自動投稿Cronサービスにはドメインを設定しません。

RailwayのCronはUTCで動くため、`0 0 * * *` は日本時間の毎日09:00です。実行後にプロセスが終了する構成なので、Cronサービスとして再実行できます。

### 必須Variables

```text
OPENAI_API_KEY=OpenAIのAPIキー
WP_URL=https://kazuhiro-beetle.com
WP_USERNAME=WordPressユーザー名
WP_APP_PASSWORD=WordPressのアプリケーションパスワード
```

## Amazonアフィリエイト

AMAZON_ASSOCIATE_TAGをRailwayのVariablesに設定すると、「部品」「用語」「購入知識」の記事にAmazon.co.jp検索リンクを自動挿入します。価格・在庫・商品画像は取得せず、記事テーマから検索キーワードを作る方式です。

リンク付近にはAmazonアソシエイトの開示文を表示します。PA-APIの認証情報は不要です。


### 任意Variables

```text
OPENAI_MODEL=gpt-4.1-mini
WP_STATUS=publish
WP_CATEGORY_ID=
AUTHOR_NAME=かずひろ
BLOG_TITLE=空冷ビートルと暮らす時間
CONTENT_CONTEXT=空冷ビートルとの暮らし、旅、日常、メンテナンスを記録するブログです。
```

`WP_APP_PASSWORD` は通常のWordPressログインパスワードではなく、WordPress管理画面の「ユーザー → プロフィール → アプリケーションパスワード」で発行してください。キーやパスワードはGitHubへ保存しないでください。

## Cloudflare設定

ドメインのDNSをCloudflareで管理し、WordPressが現在使っているホスティング先を指す既存レコードを維持します。Cloudflareのプロキシを有効にする場合は、WordPress側・Cloudflare側ともにHTTPSを有効にしてください。

このスクリプトは `WP_URL=https://kazuhiro-beetle.com` を通じてWordPressへ接続します。DNSの接続先はWordPressのホスティング先によって異なるため、RailwayのドメインをWordPressの接続先として推測して登録しないでください。

## 動作

- 日付ごとに `beetle-life-YYYY-MM-DD` のスラッグを作る
- 先に同じスラッグの記事を検索する
- すでに存在する日は二重投稿せず終了する
- 存在しない場合だけOpenAIで記事を生成して公開する
- 画像、アイキャッチ、外部リンクは追加しない
- 設定した車両情報にない個人的な事実を創作しない

ローカルで1回だけ試す場合:

```bash
npm run post
```