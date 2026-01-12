/**
 * PokeAPIクライアント
 * レート制限とエラーハンドリングを含むfetchラッパー
 */

import { RATE_LIMIT } from "./constants";
import type { PokeAPIPokemonResponse } from "@/types/pokeapi";

/** APIエラークラス */
export class PokeAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public cause?: unknown
  ) {
    super(message);
    this.name = "PokeAPIError";
  }
}

/** 指定ミリ秒待機 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** レート制限付きfetch */
async function fetchWithRetry(
  url: string,
  retries: number = RATE_LIMIT.MAX_RETRIES
): Promise<Response> {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new PokeAPIError(
        `HTTP Error: ${response.status} ${response.statusText}`,
        response.status
      );
    }

    return response;
  } catch (error) {
    if (retries > 0) {
      console.warn(
        `Retry ${RATE_LIMIT.MAX_RETRIES - retries + 1}/${RATE_LIMIT.MAX_RETRIES} for ${url}`
      );
      await sleep(RATE_LIMIT.RETRY_DELAY_MS);
      return fetchWithRetry(url, retries - 1);
    }

    throw new PokeAPIError(
      `Failed to fetch after ${RATE_LIMIT.MAX_RETRIES} retries`,
      undefined,
      error
    );
  }
}

/** ポケモンデータを取得 */
export async function fetchPokemon(id: number): Promise<PokeAPIPokemonResponse> {
  const url = `https://pokeapi.co/api/v2/pokemon/${id}`;

  try {
    const response = await fetchWithRetry(url);
    const data = await response.json();
    return data as PokeAPIPokemonResponse;
  } catch (error) {
    if (error instanceof PokeAPIError) {
      throw error;
    }
    throw new PokeAPIError("Failed to parse Pokemon data", undefined, error);
  }
}

/** 複数ポケモンを取得（レート制限付き） */
export async function fetchPokemonBatch(
  ids: number[],
  onProgress?: (current: number, total: number) => void
): Promise<PokeAPIPokemonResponse[]> {
  const results: PokeAPIPokemonResponse[] = [];

  for (let i = 0; i < ids.length; i++) {
    const pokemon = await fetchPokemon(ids[i]);
    results.push(pokemon);

    onProgress?.(i + 1, ids.length);

    // 最後のリクエスト以外は待機
    if (i < ids.length - 1) {
      await sleep(RATE_LIMIT.INTERVAL_MS);
    }
  }

  return results;
}
