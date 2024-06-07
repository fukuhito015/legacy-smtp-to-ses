# Legacy SMTP to SES

## 開発背景

AWS SES が TLS1.1 のプロトコルのサポートを廃止したため、プロキシするための SMTP サーバが必要となった。

- [Amazon SES およびセキュリティプロトコル](https://docs.aws.amazon.com/ja_jp/ses/latest/dg/security-protocols.html)

## 概要

以下のとおり、当 SMTP サーバを仲介することで、TLS3 での AWS SES 送信を可能となる

```
TLS1.1 のレガシーシステム ①---> 当 SMTPサーバ ②---> AWS SES

①: TLS1〜での送信
②: TLS3 での送信

```

## 構築

1. リポジトリをクローン

```
git clone git@github.com:fukuhito015/legacy-smtp-to-ses.git
cd legacy-smtp-to-ses

```

2. 依存関係のインストール

```
npm i
```

3. ルートディレクトリに .env ファイルを作成し、以下の環境変数を追加

```
AWS_ACCESS_KEY=AKI...
AWS_SECRET_ACCESS_KEY=wq7M...
AWS_REGION=ap-northeast-1
SMTP_AUTH_USERNAME=user_name
SMTP_AUTH_PASSWORD=password
SMTP_PORT=2525
```

## 使い方

1. 実行

```
npm run prod

（停止は以下）
npm run delete

```
