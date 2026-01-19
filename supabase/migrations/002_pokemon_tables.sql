-- ポケモンマスターデータ用テーブル
-- 正規化設計: pokemon, pokemon_stats, pokemon_types, pokemon_abilities, pokemon_sprites

-- pokemonテーブル (メインテーブル)
CREATE TABLE IF NOT EXISTS public.pokemon (
  id INTEGER PRIMARY KEY,                    -- 図鑑番号 (1-1025)
  name TEXT NOT NULL UNIQUE,                 -- 英語名
  name_ja TEXT,                              -- 日本語名
  height INTEGER NOT NULL DEFAULT 0,         -- 高さ (デシメートル)
  weight INTEGER NOT NULL DEFAULT 0,         -- 重さ (ヘクトグラム)
  base_experience INTEGER,                   -- 基礎経験値
  species_url TEXT,                          -- 種族情報URL
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- pokemon_statsテーブル (種族値)
CREATE TABLE IF NOT EXISTS public.pokemon_stats (
  id SERIAL PRIMARY KEY,
  pokemon_id INTEGER NOT NULL REFERENCES public.pokemon(id) ON DELETE CASCADE,
  hp INTEGER NOT NULL DEFAULT 0,
  attack INTEGER NOT NULL DEFAULT 0,
  defense INTEGER NOT NULL DEFAULT 0,
  special_attack INTEGER NOT NULL DEFAULT 0,
  special_defense INTEGER NOT NULL DEFAULT 0,
  speed INTEGER NOT NULL DEFAULT 0,
  UNIQUE (pokemon_id)
);

-- pokemon_typesテーブル (タイプ)
CREATE TABLE IF NOT EXISTS public.pokemon_types (
  id SERIAL PRIMARY KEY,
  pokemon_id INTEGER NOT NULL REFERENCES public.pokemon(id) ON DELETE CASCADE,
  slot INTEGER NOT NULL,                     -- スロット番号 (1 or 2)
  type_name TEXT NOT NULL,                   -- タイプ英語名 (fire, water, etc.)
  UNIQUE (pokemon_id, slot)
);

-- pokemon_abilitiesテーブル (特性)
CREATE TABLE IF NOT EXISTS public.pokemon_abilities (
  id SERIAL PRIMARY KEY,
  pokemon_id INTEGER NOT NULL REFERENCES public.pokemon(id) ON DELETE CASCADE,
  slot INTEGER NOT NULL,                     -- スロット番号
  ability_name TEXT NOT NULL,                -- 特性英語名
  is_hidden BOOLEAN NOT NULL DEFAULT false,  -- 隠れ特性フラグ
  UNIQUE (pokemon_id, slot)
);

-- pokemon_spritesテーブル (画像URL)
CREATE TABLE IF NOT EXISTS public.pokemon_sprites (
  id SERIAL PRIMARY KEY,
  pokemon_id INTEGER NOT NULL REFERENCES public.pokemon(id) ON DELETE CASCADE,
  front_default TEXT,                        -- 正面デフォルト
  front_shiny TEXT,                          -- 正面色違い
  front_female TEXT,                         -- 正面メス
  front_shiny_female TEXT,                   -- 正面色違いメス
  back_default TEXT,                         -- 背面デフォルト
  back_shiny TEXT,                           -- 背面色違い
  back_female TEXT,                          -- 背面メス
  back_shiny_female TEXT,                    -- 背面色違いメス
  official_artwork TEXT,                     -- 公式アートワーク
  official_artwork_shiny TEXT,               -- 公式アートワーク色違い
  home_front_default TEXT,                   -- HOME正面
  home_front_shiny TEXT,                     -- HOME正面色違い
  UNIQUE (pokemon_id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_pokemon_name ON public.pokemon(name);
CREATE INDEX IF NOT EXISTS idx_pokemon_name_ja ON public.pokemon(name_ja);
CREATE INDEX IF NOT EXISTS idx_pokemon_stats_pokemon_id ON public.pokemon_stats(pokemon_id);
CREATE INDEX IF NOT EXISTS idx_pokemon_types_pokemon_id ON public.pokemon_types(pokemon_id);
CREATE INDEX IF NOT EXISTS idx_pokemon_types_type_name ON public.pokemon_types(type_name);
CREATE INDEX IF NOT EXISTS idx_pokemon_abilities_pokemon_id ON public.pokemon_abilities(pokemon_id);
CREATE INDEX IF NOT EXISTS idx_pokemon_sprites_pokemon_id ON public.pokemon_sprites(pokemon_id);

-- ステータス検索用の複合インデックス（野球ゲームでよく使う検索パターン）
CREATE INDEX IF NOT EXISTS idx_pokemon_stats_attack ON public.pokemon_stats(attack);
CREATE INDEX IF NOT EXISTS idx_pokemon_stats_speed ON public.pokemon_stats(speed);
CREATE INDEX IF NOT EXISTS idx_pokemon_stats_defense ON public.pokemon_stats(defense);

-- team_membersテーブルにpokemon外部キー制約を追加
-- 注: 既存データがある場合は手動で確認が必要
ALTER TABLE public.team_members
  ADD CONSTRAINT fk_team_members_pokemon
  FOREIGN KEY (pokemon_id) REFERENCES public.pokemon(id);

-- Row Level Security (RLS) ポリシー
-- ポケモンマスターデータは全ユーザーが読み取り可能

ALTER TABLE public.pokemon ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pokemon_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pokemon_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pokemon_abilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pokemon_sprites ENABLE ROW LEVEL SECURITY;

-- 匿名ユーザーを含む全員が読み取り可能
CREATE POLICY "Anyone can read pokemon"
  ON public.pokemon FOR SELECT
  USING (true);

CREATE POLICY "Anyone can read pokemon_stats"
  ON public.pokemon_stats FOR SELECT
  USING (true);

CREATE POLICY "Anyone can read pokemon_types"
  ON public.pokemon_types FOR SELECT
  USING (true);

CREATE POLICY "Anyone can read pokemon_abilities"
  ON public.pokemon_abilities FOR SELECT
  USING (true);

CREATE POLICY "Anyone can read pokemon_sprites"
  ON public.pokemon_sprites FOR SELECT
  USING (true);

-- 書き込みはサービスロールのみ（データ投入スクリプト用）
-- デフォルトでINSERT/UPDATE/DELETEは拒否される

-- ポケモンデータを一括取得するためのビュー（JOINを簡略化）
CREATE OR REPLACE VIEW public.pokemon_full AS
SELECT
  p.id,
  p.name,
  p.name_ja,
  p.height,
  p.weight,
  p.base_experience,
  p.species_url,
  ps.hp,
  ps.attack,
  ps.defense,
  ps.special_attack,
  ps.special_defense,
  ps.speed,
  sp.front_default,
  sp.front_shiny,
  sp.official_artwork
FROM public.pokemon p
LEFT JOIN public.pokemon_stats ps ON p.id = ps.pokemon_id
LEFT JOIN public.pokemon_sprites sp ON p.id = sp.pokemon_id
ORDER BY p.id;

-- ビューのRLSポリシー
-- ビューは基底テーブルのRLSを継承するため、追加設定不要
