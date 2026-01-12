/**
 * ポケモンデータ専用キャッシュマネージャー
 */

import { getItem, setItem, removeItem } from "./storage";
import type { Pokemon } from "@/types";

/** キャッシュメタデータ */
type CacheMetadata = {
  version: string;
  timestamp: number;
  count: number;
};

/** キャッシュデータ構造 */
type PokemonCacheData = {
  metadata: CacheMetadata;
  pokemon: Pokemon[];
};

const CACHE_KEY = "pokebase_pokemon_data";
const CACHE_VERSION = "1.0.0";
const CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7日間

/** キャッシュが有効かチェック */
export function isCacheValid(): boolean {
  const cached = getItem<PokemonCacheData>(CACHE_KEY);

  if (!cached) {
    return false;
  }

  // バージョンチェック
  if (cached.metadata.version !== CACHE_VERSION) {
    console.log("Cache version mismatch, invalidating");
    return false;
  }

  // 有効期限チェック
  const now = Date.now();
  const age = now - cached.metadata.timestamp;
  if (age > CACHE_DURATION_MS) {
    console.log("Cache expired, invalidating");
    return false;
  }

  return true;
}

/** キャッシュからポケモンデータ取得 */
export function getCachedPokemon(): Pokemon[] | null {
  if (!isCacheValid()) {
    return null;
  }

  const cached = getItem<PokemonCacheData>(CACHE_KEY);
  return cached?.pokemon ?? null;
}

/** ポケモンデータをキャッシュに保存 */
export function setCachedPokemon(pokemon: Pokemon[]): void {
  const cacheData: PokemonCacheData = {
    metadata: {
      version: CACHE_VERSION,
      timestamp: Date.now(),
      count: pokemon.length,
    },
    pokemon,
  };

  setItem(CACHE_KEY, cacheData);
  console.log(`Cached ${pokemon.length} Pokemon`);
}

/** キャッシュをクリア */
export function clearPokemonCache(): void {
  removeItem(CACHE_KEY);
  console.log("Pokemon cache cleared");
}
