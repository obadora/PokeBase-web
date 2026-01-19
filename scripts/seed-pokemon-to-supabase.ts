/**
 * ポケモンデータをSupabaseに投入するスクリプト
 * 一度だけ実行してマスターデータを登録する
 *
 * 使用方法:
 * 1. .env.localにSUPABASE_SERVICE_ROLE_KEYを追加
 * 2. npm run seed-pokemon
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

// .env.localを読み込む
config({ path: resolve(process.cwd(), ".env.local") });

// 設定
const POKEAPI_BASE_URL = "https://pokeapi.co/api/v2";
const START_ID = 1;
const END_ID = 1025; // 第9世代まで
const RATE_LIMIT_MS = 100; // 100ms間隔
const BATCH_SIZE = 50; // バッチインサートのサイズ

// 環境変数からSupabase接続情報を取得
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Error: 環境変数が設定されていません");
  console.error("");
  console.error(".env.localに以下を追加してください:");
  console.error("  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key");
  console.error("");
  console.error("サービスロールキーはSupabaseダッシュボードの");
  console.error("Settings > API > Project API keys > service_role から取得できます");
  process.exit(1);
}

// サービスロールキーでSupabaseクライアントを作成（RLSをバイパス）
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// 型定義
interface PokemonData {
  id: number;
  name: string;
  nameJa?: string;
  height: number;
  weight: number;
  base_experience: number | null;
  species: { url: string };
  stats: Array<{ base_stat: number; stat: { name: string } }>;
  types: Array<{ slot: number; type: { name: string } }>;
  abilities: Array<{ slot: number; ability: { name: string }; is_hidden: boolean }>;
  sprites: {
    front_default: string | null;
    front_shiny: string | null;
    front_female: string | null;
    front_shiny_female: string | null;
    back_default: string | null;
    back_shiny: string | null;
    back_female: string | null;
    back_shiny_female: string | null;
    other?: {
      "official-artwork"?: {
        front_default: string | null;
        front_shiny: string | null;
      };
      home?: {
        front_default: string | null;
        front_shiny: string | null;
      };
    };
  };
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchPokemon(id: number): Promise<PokemonData> {
  const url = `${POKEAPI_BASE_URL}/pokemon/${id}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch Pokemon #${id}: ${response.status}`);
  }

  const pokemonData = await response.json();
  await sleep(RATE_LIMIT_MS);

  // 日本語名を取得
  try {
    const speciesResponse = await fetch(pokemonData.species.url);
    if (speciesResponse.ok) {
      const speciesData = await speciesResponse.json();
      const japaneseName = speciesData.names.find((n: { language: { name: string }; name: string }) => n.language.name === "ja");
      if (japaneseName) {
        pokemonData.nameJa = japaneseName.name;
      }
    }
    await sleep(RATE_LIMIT_MS);
  } catch (error) {
    console.warn(`Failed to fetch Japanese name for Pokemon #${id}:`, error);
  }

  return pokemonData;
}

async function insertPokemonBatch(pokemonList: PokemonData[]): Promise<void> {
  // pokemon テーブル
  const pokemonRows = pokemonList.map((p) => ({
    id: p.id,
    name: p.name,
    name_ja: p.nameJa || null,
    height: p.height,
    weight: p.weight,
    base_experience: p.base_experience,
    species_url: p.species.url,
  }));

  const { error: pokemonError } = await supabase.from("pokemon").upsert(pokemonRows, { onConflict: "id" });
  if (pokemonError) {
    throw new Error(`Failed to insert pokemon: ${pokemonError.message}`);
  }

  // pokemon_stats テーブル
  const statsRows = pokemonList.map((p) => {
    const getStatValue = (name: string) => p.stats.find((s) => s.stat.name === name)?.base_stat || 0;
    return {
      pokemon_id: p.id,
      hp: getStatValue("hp"),
      attack: getStatValue("attack"),
      defense: getStatValue("defense"),
      special_attack: getStatValue("special-attack"),
      special_defense: getStatValue("special-defense"),
      speed: getStatValue("speed"),
    };
  });

  const { error: statsError } = await supabase.from("pokemon_stats").upsert(statsRows, { onConflict: "pokemon_id" });
  if (statsError) {
    throw new Error(`Failed to insert pokemon_stats: ${statsError.message}`);
  }

  // pokemon_types テーブル
  const typesRows = pokemonList.flatMap((p) =>
    p.types.map((t) => ({
      pokemon_id: p.id,
      slot: t.slot,
      type_name: t.type.name,
    }))
  );

  // 既存データを削除してから挿入（upsertだと複合キーの扱いが複雑）
  for (const p of pokemonList) {
    await supabase.from("pokemon_types").delete().eq("pokemon_id", p.id);
  }
  if (typesRows.length > 0) {
    const { error: typesError } = await supabase.from("pokemon_types").insert(typesRows);
    if (typesError) {
      throw new Error(`Failed to insert pokemon_types: ${typesError.message}`);
    }
  }

  // pokemon_abilities テーブル
  const abilitiesRows = pokemonList.flatMap((p) =>
    p.abilities.map((a) => ({
      pokemon_id: p.id,
      slot: a.slot,
      ability_name: a.ability.name,
      is_hidden: a.is_hidden,
    }))
  );

  for (const p of pokemonList) {
    await supabase.from("pokemon_abilities").delete().eq("pokemon_id", p.id);
  }
  if (abilitiesRows.length > 0) {
    const { error: abilitiesError } = await supabase.from("pokemon_abilities").insert(abilitiesRows);
    if (abilitiesError) {
      throw new Error(`Failed to insert pokemon_abilities: ${abilitiesError.message}`);
    }
  }

  // pokemon_sprites テーブル
  const spritesRows = pokemonList.map((p) => ({
    pokemon_id: p.id,
    front_default: p.sprites.front_default,
    front_shiny: p.sprites.front_shiny,
    front_female: p.sprites.front_female,
    front_shiny_female: p.sprites.front_shiny_female,
    back_default: p.sprites.back_default,
    back_shiny: p.sprites.back_shiny,
    back_female: p.sprites.back_female,
    back_shiny_female: p.sprites.back_shiny_female,
    official_artwork: p.sprites.other?.["official-artwork"]?.front_default || null,
    official_artwork_shiny: p.sprites.other?.["official-artwork"]?.front_shiny || null,
    home_front_default: p.sprites.other?.home?.front_default || null,
    home_front_shiny: p.sprites.other?.home?.front_shiny || null,
  }));

  const { error: spritesError } = await supabase.from("pokemon_sprites").upsert(spritesRows, { onConflict: "pokemon_id" });
  if (spritesError) {
    throw new Error(`Failed to insert pokemon_sprites: ${spritesError.message}`);
  }
}

async function main() {
  console.log("=== Pokemon Data Seeder for Supabase ===");
  console.log(`Target: Pokemon #${START_ID} - #${END_ID}`);
  console.log(`Supabase URL: ${supabaseUrl}`);
  console.log("");

  const startTime = Date.now();
  let batch: PokemonData[] = [];
  let processedCount = 0;

  for (let id = START_ID; id <= END_ID; id++) {
    try {
      console.log(`Fetching Pokemon #${id}...`);
      const pokemon = await fetchPokemon(id);
      batch.push(pokemon);

      // バッチサイズに達したらDBに投入
      if (batch.length >= BATCH_SIZE) {
        console.log(`Inserting batch (${processedCount + 1} - ${processedCount + batch.length})...`);
        await insertPokemonBatch(batch);
        processedCount += batch.length;
        batch = [];

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const progress = ((processedCount / END_ID) * 100).toFixed(1);
        console.log(`Progress: ${processedCount}/${END_ID} (${progress}%) - Elapsed: ${elapsed}s\n`);
      }
    } catch (error) {
      console.error(`Error processing Pokemon #${id}:`, error);
      throw error;
    }
  }

  // 残りのバッチを投入
  if (batch.length > 0) {
    console.log(`Inserting final batch (${processedCount + 1} - ${processedCount + batch.length})...`);
    await insertPokemonBatch(batch);
    processedCount += batch.length;
  }

  const endTime = Date.now();
  const totalTime = ((endTime - startTime) / 1000).toFixed(1);

  console.log("\n=== Seeding Complete ===");
  console.log(`Total Pokemon: ${processedCount}`);
  console.log(`Total time: ${totalTime}s`);
  console.log(`Average: ${(processedCount / parseFloat(totalTime)).toFixed(2)} pokemon/sec`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
