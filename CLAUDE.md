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
| `npm run lint` | ESLintでコードをチェック |
| `npm run format` | Prettierでコードをフォーマット |
| `npm run format:check` | フォーマットをチェック（変更なし） |

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
- Format code with Prettier before committing
- Use `@/` path alias for imports (e.g., `import { Pokemon } from "@/types"`)
- The root layout sets `lang="ja"` for Japanese content
- All React Server Components by default (use `"use client"` directive when needed)
