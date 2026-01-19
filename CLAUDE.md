# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PokeBase-web is the web client application for the PokeBase app. This is a Next.js 15 project using the App Router, TypeScript, and Tailwind CSS.

**Language**: This project uses Japanese for documentation, comments, and commit messages.

## Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode enabled)
- **Styling**: Tailwind CSS
- **Linting**: ESLint (next/core-web-vitals, next/typescript)
- **Formatting**: Prettier
- **Package Manager**: npm

## Development Language and Communication

- **All documentation, comments, PR descriptions, and commit messages should be in Japanese**
- Issue templates and PR templates are in Japanese
- Follow the existing Japanese conventions in the codebase

## Pull Request Process

When creating pull requests, follow the template format in `.github/pull_request_template.md`:

- **Title format**: `【feature/XXX】タイトル`
- Required sections:
  - 概要 (Overview)
  - 関連タスク (Related tasks - link issues with `#<IssueNumber>`)
  - やったこと (What was done)
  - やらないこと (What was not done)
  - 動作確認 (Testing confirmation)
  - 備考 (Notes)

## Issue Templates

Two issue templates are available:
- Bug report (バグレポート) - `.github/ISSUE_TEMPLATE/bug_report.md`
- Feature request (機能リクエスト) - `.github/ISSUE_TEMPLATE/feature_request.md`

## Branch Strategy

- Main branch: `main`
- Feature branches: Use `feature/` prefix (e.g., `feature/2-develop-settings`)
- All issues are automatically added to the project board at https://github.com/users/obadora/projects/11

## Commands

| Command | Description |
|---------|-------------|
| `npm install` | 依存パッケージをインストール |
| `npm run dev` | 開発サーバーを起動 (http://localhost:3000) |
| `npm run build` | 本番用ビルドを作成 |
| `npm start` | 本番サーバーを起動 |
| `npm test` | Jestでテストを実行 |
| `npm run test:watch` | ウォッチモードでテストを実行 |
| `npm run test:coverage` | カバレッジレポート付きでテストを実行 |
| `npm run lint` | ESLintでコードをチェック |
| `npm run type-check` | TypeScriptの型チェックを実行 |
| `npm run format` | Prettierでコードをフォーマット |
| `npm run format:check` | フォーマットをチェック（変更なし） |
| `npm run validate` | type-check + lint + format:checkをまとめて実行 |
| `npm run seed-pokemon` | PokeAPIからデータを取得しSupabaseに投入（初回のみ） |

## Project Structure

```
src/
├── app/              # Next.js App Router - pages and layouts
│   ├── layout.tsx    # Root layout (sets lang="ja")
│   ├── page.tsx      # Home page
│   └── globals.css   # Global styles with Tailwind directives
├── components/       # Reusable React components
├── lib/             # Utility functions and helpers
├── types/           # TypeScript type definitions
│   └── index.ts     # Common type definitions (Pokemon, Base, etc.)
└── styles/          # Additional styles (if needed)
```

## Development Guidelines

- Use TypeScript strict mode
- Follow ESLint rules (next/core-web-vitals, next/typescript)
- Format code with Prettier before committing (settings in `.prettierrc.json`)
- Use `@/` path alias for imports (e.g., `import { Pokemon } from "@/types"`)
- The root layout sets `lang="ja"` for Japanese content
- All React Server Components by default (use `"use client"` directive when needed)

## Pokemon Data Management

ポケモンデータ（第1-9世代、1025匹）はSupabaseデータベースに保存されます。

### データベース構成

正規化されたテーブル設計:
- `pokemon` - 基本情報（ID、名前、身長、体重など）
- `pokemon_stats` - 種族値（HP、攻撃、防御など）
- `pokemon_types` - タイプ情報
- `pokemon_abilities` - 特性情報
- `pokemon_sprites` - 画像URL
- `pokemon_full` - 上記を結合したビュー

### 初期セットアップ

1. Supabaseでマイグレーションを実行:
   ```bash
   supabase db push
   ```

2. ポケモンデータを投入（初回のみ、約4-5分）:
   ```bash
   SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=xxx npm run seed-pokemon
   ```

### データフロー

1. クライアントがポケモンデータを要求
2. localStorageキャッシュをチェック（7日間有効）
3. キャッシュがない場合、Supabaseから取得
4. 取得したデータをlocalStorageにキャッシュ

**メリット**:
- ビルド時間が大幅短縮（PokeAPI取得が不要）
- デプロイのたびにデータ取得する必要がない
- 将来的な機能拡張（検索、フィルタリング）が容易

## Deployment

This project can be deployed to Vercel:

```bash
npx vercel
```

**注意**:
- 事前にSupabaseにポケモンデータを投入しておく必要があります
- 環境変数 `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` を設定してください
