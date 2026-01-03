# PokeBase-web

PokeBaseアプリのWebクライアントアプリケーション

## 概要

ポケモンの基地管理を行うWebアプリケーションです。Next.js、TypeScript、Tailwind CSSを使用して構築されています。

## 技術スタック

- **フレームワーク**: Next.js 15 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **パッケージマネージャー**: npm

## セットアップ

### 依存パッケージのインストール

```bash
npm install
```

### 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いて確認できます。

## コマンド

| コマンド | 説明 |
|---------|------|
| `npm run dev` | 開発サーバーを起動 |
| `npm run build` | 本番用ビルドを作成 |
| `npm start` | 本番サーバーを起動 |
| `npm run lint` | ESLintでコードをチェック |
| `npm run format` | Prettierでコードをフォーマット |
| `npm run format:check` | フォーマットをチェック（変更なし） |

## ディレクトリ構造

```
src/
├── app/              # Next.js App Router のページとレイアウト
├── components/       # 再利用可能なReactコンポーネント
├── lib/             # ユーティリティ関数とヘルパー
├── types/           # TypeScript型定義
└── styles/          # グローバルスタイル
```

## デプロイ

このプロジェクトはVercelにデプロイ可能です。

```bash
# Vercel CLIを使用してデプロイ
npx vercel
```

## ライセンス

プライベートプロジェクト
