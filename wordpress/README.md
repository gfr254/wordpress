# WordPress本体（Railway用）

このディレクトリは、`gfr254/wordpress` リポジトリからWordPress本体をRailwayへデプロイするための設定です。

## Railwayで作成するサービス

同じリポジトリから、次の2サービスを作成します。

### 1. WordPress Webサービス

- Root Directory: `/wordpress`
- Dockerfile: `wordpress/Dockerfile`
- 長時間起動する通常のWebサービス
- Custom Domain: `kazuhiro-beetle.com`

### 2. 自動投稿Cronサービス

- Root Directory: `/`
- Start Command: `npm run post`
- Cron Schedule: `0 0 * * *`
- Custom Domainは設定しない

現在Cloudflareで設定しているCNAMEは、後者ではなく、WordPress Webサービスに表示されるRailwayドメインへ変更します。

## MySQL

RailwayでMySQLサービスを追加し、WordPress Webサービスに次のVariablesを設定します。`${{MySQL.変数名}}` はRailwayのVariable Referenceで入力してください。

```text
WORDPRESS_DB_HOST=${{MySQL.MYSQLHOST}}:${{MySQL.MYSQLPORT}}
WORDPRESS_DB_USER=${{MySQL.MYSQLUSER}}
WORDPRESS_DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
WORDPRESS_DB_NAME=${{MySQL.MYSQLDATABASE}}
```

WordPress本体とMySQLは同じRailwayプロジェクトに追加してください。MySQLのボリュームを有効にしないと、再デプロイ時にデータが失われる可能性があります。

## 自動投稿サービス側のVariables

Cronサービスには、リポジトリ直下の `.env.example` にある次の値を設定します。

```text
OPENAI_API_KEY
WP_URL=https://kazuhiro-beetle.com
WP_USERNAME
WP_APP_PASSWORD
```

WordPress管理画面でアプリケーションパスワードを発行し、通常のログインパスワードではなく `WP_APP_PASSWORD` に設定してください。