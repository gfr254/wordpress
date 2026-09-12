#!/bin/bash
set -e

# RailwayはPORT環境変数で公開ポートを渡すため、Apacheも同じポートで待ち受ける。
PORT="${PORT:-80}"
sed -ri "s/Listen 80/Listen ${PORT}/" /etc/apache2/ports.conf
sed -ri "s/<VirtualHost \*:80>/<VirtualHost *:${PORT}>/" \
  /etc/apache2/sites-available/000-default.conf

exec /usr/local/bin/docker-entrypoint.sh "$@"