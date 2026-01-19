/**
 * ポケモンデータ統合管理サービス
 * Supabaseからデータを取得
 */

"use client";

import { fetchAllPokemonFromDB } from "@/lib/supabase/pokemon";
import type { Pokemon } from "@/types";

// メモリキャッシュ（ページリロードでクリア）
let memoryCache: Pokemon[] | null = null;

/**
 * 全ポケモンデータ取得
 * メモリキャッシュがあればそれを返し、なければSupabaseから取得
 */
export async function getAllPokemon(): Promise<Pokemon[]> {
  // メモリキャッシュがあれば返す
  if (memoryCache && memoryCache.length > 0) {
    console.log(`Loaded ${memoryCache.length} Pokemon from memory cache`);
    return memoryCache;
  }

  // Supabaseから取得
  console.log("Loading Pokemon from Supabase");
  const { data: pokemon, error } = await fetchAllPokemonFromDB();

  if (error) {
    console.error("Failed to load Pokemon from Supabase:", error);
    throw error;
  }

  if (pokemon.length === 0) {
    console.warn("No Pokemon data found in database");
    return [];
  }

  // メモリキャッシュに保存
  memoryCache = pokemon;
  console.log(`Loaded ${pokemon.length} Pokemon from Supabase`);

  return pokemon;
}

/**
 * メモリキャッシュをクリア
 */
export function clearPokemonMemoryCache(): void {
  memoryCache = null;
  console.log("Pokemon memory cache cleared");
}

/**
 * IDでポケモン検索
 * @param id ポケモンID
 * @returns ポケモン
 */
export async function getPokemonById(id: number): Promise<Pokemon | null> {
  const allPokemon = await getAllPokemon();
  return allPokemon.find((p) => p.id === id) ?? null;
}

/**
 * 名前でポケモン検索
 * @param name ポケモン名（英語）
 * @returns ポケモン
 */
export async function getPokemonByName(name: string): Promise<Pokemon | null> {
  const allPokemon = await getAllPokemon();
  return allPokemon.find((p) => p.name.toLowerCase() === name.toLowerCase()) ?? null;
}
