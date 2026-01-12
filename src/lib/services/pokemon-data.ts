/**
 * ポケモンデータ統合管理サービス
 * クライアント側でlocalStorageと静的JSONファイルを使用してデータを管理
 */

"use client";

import { getCachedPokemon, setCachedPokemon, isCacheValid } from "@/lib/storage/pokemon-cache";
import type { Pokemon } from "@/types";
import type { PokeAPIPokemonResponse } from "@/types/pokeapi";

/** PokeAPIレスポンスをアプリケーション型に変換 */
function transformPokemon(apiResponse: PokeAPIPokemonResponse): Pokemon {
  return {
    id: apiResponse.id,
    name: apiResponse.name,
    nameJa: apiResponse.nameJa, // スクリプトで追加された日本語名
    height: apiResponse.height,
    weight: apiResponse.weight,
    baseExperience: apiResponse.base_experience,
    types: apiResponse.types.map((t) => ({
      slot: t.slot,
      typeName: t.type.name,
    })),
    stats: {
      hp: apiResponse.stats.find((s) => s.stat.name === "hp")?.base_stat ?? 0,
      attack: apiResponse.stats.find((s) => s.stat.name === "attack")?.base_stat ?? 0,
      defense: apiResponse.stats.find((s) => s.stat.name === "defense")?.base_stat ?? 0,
      specialAttack:
        apiResponse.stats.find((s) => s.stat.name === "special-attack")?.base_stat ?? 0,
      specialDefense:
        apiResponse.stats.find((s) => s.stat.name === "special-defense")?.base_stat ?? 0,
      speed: apiResponse.stats.find((s) => s.stat.name === "speed")?.base_stat ?? 0,
    },
    abilities: apiResponse.abilities.map((a) => ({
      name: a.ability.name,
      isHidden: a.is_hidden,
      slot: a.slot,
    })),
    sprites: {
      frontDefault: apiResponse.sprites.front_default,
      frontShiny: apiResponse.sprites.front_shiny,
      officialArtwork: apiResponse.sprites.other?.["official-artwork"]?.front_default ?? null,
    },
    speciesUrl: apiResponse.species.url,
  };
}

/** 静的JSONファイルから全ポケモンデータ取得 */
async function fetchPokemonFromStatic(): Promise<Pokemon[]> {
  try {
    const response = await fetch("/data/pokemon.json");

    if (!response.ok) {
      throw new Error(`Failed to fetch static data: ${response.status}`);
    }

    const apiData: PokeAPIPokemonResponse[] = await response.json();
    return apiData.map(transformPokemon);
  } catch (error) {
    console.error("Failed to load static Pokemon data", error);
    throw error;
  }
}

/** 全ポケモンデータ取得（キャッシュ優先） */
export async function getAllPokemon(): Promise<Pokemon[]> {
  // 1. localStorageキャッシュをチェック
  if (isCacheValid()) {
    const cached = getCachedPokemon();
    if (cached) {
      console.log("Loaded Pokemon from cache");
      return cached;
    }
  }

  // 2. 静的JSONファイルから取得
  console.log("Loading Pokemon from static file");
  const pokemon = await fetchPokemonFromStatic();

  // 3. localStorageに保存
  setCachedPokemon(pokemon);

  return pokemon;
}

/** IDでポケモン検索 */
export async function getPokemonById(id: number): Promise<Pokemon | null> {
  const allPokemon = await getAllPokemon();
  return allPokemon.find((p) => p.id === id) ?? null;
}

/** 名前でポケモン検索 */
export async function getPokemonByName(name: string): Promise<Pokemon | null> {
  const allPokemon = await getAllPokemon();
  return allPokemon.find((p) => p.name.toLowerCase() === name.toLowerCase()) ?? null;
}
