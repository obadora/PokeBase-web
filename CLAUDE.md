# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PokeBase-web is a Pokemon baseball team management game. Players build teams by scouting Pokemon, assign them to baseball positions based on their stats, and compete in tournaments with simulated matches.

**Language**: This project uses Japanese for documentation, comments, and commit messages.

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | 開発サーバーを起動 (http://localhost:3000) |
| `npm run build` | 本番用ビルドを作成 |
| `npm test` | Jestでテストを実行 |
| `npm run test -- path/to/file.test.ts` | 特定のテストファイルを実行 |
| `npm run test:watch` | テストをwatchモードで実行 |
| `npm run test:coverage` | カバレッジ付きでテストを実行 |
| `npm run validate` | type-check + lint + format:checkをまとめて実行 |
| `npm run format` | Prettierでコードをフォーマット |

## Architecture

### Core Domain Model

**Pokemon → Baseball Player Mapping** (`src/lib/calculator/`)
- Pokemon base stats (HP, Attack, Defense, Sp.Atk, Sp.Def, Speed) are converted to baseball abilities
- **Fielder abilities**: meet, power, speed, arm, defense, stamina
- **Pitcher abilities**: velocity, control, stamina, breaking

**Position Fitness System** (`src/lib/evaluator/position.ts`)
- Each Pokemon gets a fitness score (0-100) for all 9 positions
- Scores are converted to star ratings (1-5) and ranks
- Position weights defined in `src/lib/constants/weights.ts`

**Match Simulation** (`src/lib/simulator/`)
- `match.ts`: Main simulation orchestrator
- `player-stats.ts`: At-bat simulation with baseball rules
- Team power = 30% offense + 30% defense + 40% pitching

**Tournament System** (`src/lib/services/tournament.ts`)
- Generates bracket structure and opponent teams
- Tracks player progression through rounds
- Tournament types: district, regional, national

### State Management

Zustand stores in `src/store/`:
- `auth.ts`: Authentication state
- `team.ts`: Current team and members
- `tournament.ts`: Tournament progress

### Data Flow

1. Pokemon data: Supabase → localStorage cache (7 days) → React components
2. Team operations: React components → Zustand store → Supabase
3. Match results: Simulator → UI display (not persisted to DB yet)

### Key Types

```
src/types/
├── index.ts       # Pokemon, PokemonStats, PokemonTypeInfo
├── ability.ts     # FielderAbility, PitcherAbility, Rank
├── position.ts    # Position (9 baseball positions), PositionFitness
├── team.ts        # Team, TeamMember, Grade (1-3年生)
├── match.ts       # MatchResult, BatterStats, PitcherStats, AtBatResult
└── opponent.ts    # OpponentTeam, TournamentBracket, TournamentMatch
```

## Pull Request Process

- **Title format**: `【feature/XXX】タイトル`
- Required sections in template: 概要, 関連タスク, やったこと, やらないこと, 動作確認, 備考

## Development Guidelines

- Use `@/` path alias for imports
- All React Server Components by default (use `"use client"` when needed)
- Run `npm run validate` before committing

## Database Setup (初回のみ)

ポケモンデータ（第1-9世代、1025匹）はSupabaseに保存:

```bash
supabase db push
SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=xxx npm run seed-pokemon
```

環境変数: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
