/**
 * ポケモンデータ取得関数（Supabase版）
 */

import { supabase } from "./client";
import type { Pokemon } from "@/types";

/**
 * pokemon_fullビューからアプリケーション用のPokemon型に変換
 */
interface PokemonFullRow {
  id: number;
  name: string;
  name_ja: string | null;
  height: number;
  weight: number;
  base_experience: number | null;
  species_url: string | null;
  hp: number;
  attack: number;
  defense: number;
  special_attack: number;
  special_defense: number;
  speed: number;
  front_default: string | null;
  front_shiny: string | null;
  official_artwork: string | null;
}

/**
 * DBの行データをアプリケーション用のPokemon型に変換
 */
function transformPokemonRow(row: PokemonFullRow): Pokemon {
  return {
    id: row.id,
    name: row.name,
    nameJa: row.name_ja || undefined,
    height: row.height,
    weight: row.weight,
    baseExperience: row.base_experience,
    types: [], // 別途取得が必要
    stats: {
      hp: row.hp,
      attack: row.attack,
      defense: row.defense,
      specialAttack: row.special_attack,
      specialDefense: row.special_defense,
      speed: row.speed,
    },
    abilities: [], // 別途取得が必要
    sprites: {
      frontDefault: row.front_default,
      frontShiny: row.front_shiny,
      officialArtwork: row.official_artwork,
    },
    speciesUrl: row.species_url || "",
  };
}

/**
 * ページネーションで全件取得するヘルパー関数
 */
async function fetchAllFromTable<T>(
  tableName: string,
  selectColumns: string,
  orderBy: string[],
  pageSize: number = 1000
): Promise<{ data: T[]; error: Error | null }> {
  const allData: T[] = [];
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    let query = supabase.from(tableName).select(selectColumns);

    // 複数カラムでのorderを適用
    for (const col of orderBy) {
      query = query.order(col);
    }

    const { data, error } = await query.range(from, from + pageSize - 1);

    if (error) {
      return { data: [], error: new Error(error.message) };
    }

    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      allData.push(...(data as T[]));
      from += pageSize;
      // 取得件数がページサイズ未満なら終了
      if (data.length < pageSize) {
        hasMore = false;
      }
    }
  }

  return { data: allData, error: null };
}

/**
 * 全ポケモンデータを取得（pokemon_fullビュー使用）
 * @returns ポケモン一覧
 */
export async function fetchAllPokemonFromDB(): Promise<{
  data: Pokemon[];
  error: Error | null;
}> {
  // ビューから基本データを取得（ページネーションで全件取得）
  const { data: pokemonRows, error: pokemonError } = await fetchAllFromTable<PokemonFullRow>(
    "pokemon_full",
    "*",
    ["id"]
  );

  if (pokemonError) {
    return { data: [], error: pokemonError };
  }

  if (!pokemonRows || pokemonRows.length === 0) {
    return { data: [], error: null };
  }

  // タイプ情報を一括取得
  const { data: typesRows, error: typesError } = await fetchAllFromTable<{
    pokemon_id: number;
    slot: number;
    type_name: string;
  }>("pokemon_types", "pokemon_id, slot, type_name", ["pokemon_id", "slot"]);

  if (typesError) {
    console.warn("Failed to fetch pokemon types:", typesError);
  }

  // 特性情報を一括取得
  const { data: abilitiesRows, error: abilitiesError } = await fetchAllFromTable<{
    pokemon_id: number;
    slot: number;
    ability_name: string;
    is_hidden: boolean;
  }>("pokemon_abilities", "pokemon_id, slot, ability_name, is_hidden", ["pokemon_id", "slot"]);

  if (abilitiesError) {
    console.warn("Failed to fetch pokemon abilities:", abilitiesError);
  }

  // タイプと特性をポケモンIDでグループ化
  const typesMap = new Map<number, Array<{ slot: number; typeName: string }>>();
  const abilitiesMap = new Map<number, Array<{ name: string; isHidden: boolean; slot: number }>>();

  typesRows?.forEach((row) => {
    if (!typesMap.has(row.pokemon_id)) {
      typesMap.set(row.pokemon_id, []);
    }
    typesMap.get(row.pokemon_id)!.push({
      slot: row.slot,
      typeName: row.type_name,
    });
  });

  abilitiesRows?.forEach((row) => {
    if (!abilitiesMap.has(row.pokemon_id)) {
      abilitiesMap.set(row.pokemon_id, []);
    }
    abilitiesMap.get(row.pokemon_id)!.push({
      name: row.ability_name,
      isHidden: row.is_hidden,
      slot: row.slot,
    });
  });

  // Pokemon型に変換
  const pokemon: Pokemon[] = pokemonRows.map((row) => {
    const p = transformPokemonRow(row as PokemonFullRow);
    p.types = typesMap.get(row.id) || [];
    p.abilities = abilitiesMap.get(row.id) || [];
    return p;
  });

  return { data: pokemon, error: null };
}

/**
 * IDでポケモンを取得
 * @param id ポケモンID
 * @returns ポケモン
 */
export async function fetchPokemonByIdFromDB(
  id: number
): Promise<{ data: Pokemon | null; error: Error | null }> {
  const { data: row, error: pokemonError } = await supabase
    .from("pokemon_full")
    .select("*")
    .eq("id", id)
    .single();

  if (pokemonError) {
    return { data: null, error: new Error(pokemonError.message) };
  }

  if (!row) {
    return { data: null, error: null };
  }

  // タイプ取得
  const { data: typesRows } = await supabase
    .from("pokemon_types")
    .select("slot, type_name")
    .eq("pokemon_id", id)
    .order("slot");

  // 特性取得
  const { data: abilitiesRows } = await supabase
    .from("pokemon_abilities")
    .select("slot, ability_name, is_hidden")
    .eq("pokemon_id", id)
    .order("slot");

  const pokemon = transformPokemonRow(row as PokemonFullRow);
  pokemon.types = typesRows?.map((t) => ({ slot: t.slot, typeName: t.type_name })) || [];
  pokemon.abilities =
    abilitiesRows?.map((a) => ({
      name: a.ability_name,
      isHidden: a.is_hidden,
      slot: a.slot,
    })) || [];

  return { data: pokemon, error: null };
}

/**
 * 名前でポケモンを検索
 * @param name ポケモン名（英語または日本語）
 * @returns ポケモン
 */
export async function fetchPokemonByNameFromDB(
  name: string
): Promise<{ data: Pokemon | null; error: Error | null }> {
  const lowerName = name.toLowerCase();

  const { data: row, error: pokemonError } = await supabase
    .from("pokemon_full")
    .select("*")
    .or(`name.ilike.${lowerName},name_ja.eq.${name}`)
    .single();

  if (pokemonError) {
    if (pokemonError.code === "PGRST116") {
      // 見つからない場合
      return { data: null, error: null };
    }
    return { data: null, error: new Error(pokemonError.message) };
  }

  if (!row) {
    return { data: null, error: null };
  }

  // タイプ・特性は省略（必要に応じて追加）
  const pokemon = transformPokemonRow(row as PokemonFullRow);

  return { data: pokemon, error: null };
}

/**
 * ステータスでポケモンをフィルタリング
 * @param filters フィルター条件
 * @returns ポケモン一覧
 */
export async function fetchPokemonByStatsFromDB(filters: {
  minAttack?: number;
  minSpeed?: number;
  minDefense?: number;
  minHp?: number;
  typeName?: string;
}): Promise<{ data: Pokemon[]; error: Error | null }> {
  let query = supabase.from("pokemon_full").select("*");

  if (filters.minAttack) {
    query = query.gte("attack", filters.minAttack);
  }
  if (filters.minSpeed) {
    query = query.gte("speed", filters.minSpeed);
  }
  if (filters.minDefense) {
    query = query.gte("defense", filters.minDefense);
  }
  if (filters.minHp) {
    query = query.gte("hp", filters.minHp);
  }

  const { data: pokemonRows, error } = await query.order("id");

  if (error) {
    return { data: [], error: new Error(error.message) };
  }

  let pokemon: Pokemon[] = (pokemonRows || []).map((row) =>
    transformPokemonRow(row as PokemonFullRow)
  );

  // タイプフィルタリング（JOINが複雑なので後処理）
  if (filters.typeName) {
    const { data: typeMatches } = await supabase
      .from("pokemon_types")
      .select("pokemon_id")
      .eq("type_name", filters.typeName);

    const matchedIds = new Set(typeMatches?.map((t) => t.pokemon_id) || []);
    pokemon = pokemon.filter((p) => matchedIds.has(p.id));
  }

  return { data: pokemon, error: null };
}
