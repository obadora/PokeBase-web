/**
 * PokeAPI関連の定数定義
 */

export const POKEAPI_BASE_URL = "https://pokeapi.co/api/v2";

export const POKEAPI_ENDPOINTS = {
  pokemon: (id: number | string) => `${POKEAPI_BASE_URL}/pokemon/${id}`,
  pokemonList: () => `${POKEAPI_BASE_URL}/pokemon`,
  pokemonSpecies: (id: number | string) => `${POKEAPI_BASE_URL}/pokemon-species/${id}`,
} as const;

/** 全ポケモンID範囲（第1-9世代） */
export const ALL_POKEMON_RANGE = {
  START: 1,
  END: 1025, // 第9世代まで
} as const;

/** レート制限設定 */
export const RATE_LIMIT = {
  INTERVAL_MS: 100, // リクエスト間隔: 100ms (10req/sec)
  MAX_RETRIES: 3, // 最大リトライ回数
  RETRY_DELAY_MS: 1000, // リトライ待機時間
} as const;
