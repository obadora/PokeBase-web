/**
 * ビルド前データ取得スクリプト
 * 全ポケモン（ID: 1-1025、第1-9世代）のデータをPokeAPIから取得
 */

import * as fs from "fs";
import * as path from "path";

const POKEAPI_BASE_URL = "https://pokeapi.co/api/v2";
const START_ID = 1;
const END_ID = 1025; // 第9世代まで
const RATE_LIMIT_MS = 100; // 100ms間隔（10req/sec）
const OUTPUT_DIR = path.join(process.cwd(), "public", "data");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "pokemon.json");

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchPokemon(id: number): Promise<any> {
  const url = `${POKEAPI_BASE_URL}/pokemon/${id}`;
  console.log(`Fetching Pokemon #${id}...`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch Pokemon #${id}: ${response.status}`);
  }

  const pokemonData = await response.json();

  // レート制限を適用
  await sleep(RATE_LIMIT_MS);

  // 種族データから日本語名を取得
  try {
    const speciesResponse = await fetch(pokemonData.species.url);
    if (!speciesResponse.ok) {
      throw new Error(`Failed to fetch species: ${speciesResponse.status}`);
    }
    const speciesData = await speciesResponse.json();
    const japaneseName = speciesData.names.find((n: any) => n.language.name === "ja");
    if (japaneseName) {
      pokemonData.nameJa = japaneseName.name;
    }

    // レート制限を適用
    await sleep(RATE_LIMIT_MS);
  } catch (error) {
    console.warn(`Failed to fetch Japanese name for Pokemon #${id}:`, error);
  }

  return pokemonData;
}

async function main() {
  console.log(`Starting Pokemon data fetch (ID: ${START_ID}-${END_ID})`);
  console.log(`Rate limit: ${RATE_LIMIT_MS}ms interval`);

  const startTime = Date.now();
  const allPokemon: any[] = [];

  // 出力ディレクトリ作成
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`Created output directory: ${OUTPUT_DIR}`);
  }

  // 全ポケモンデータ取得
  for (let id = START_ID; id <= END_ID; id++) {
    try {
      const pokemon = await fetchPokemon(id);
      allPokemon.push(pokemon);

      // 進捗表示（10匹ごと）
      if (id % 10 === 0) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const progress = ((id / END_ID) * 100).toFixed(1);
        console.log(`Progress: ${id}/${END_ID} (${progress}%) - Elapsed: ${elapsed}s`);
      }
    } catch (error) {
      console.error(`Error fetching Pokemon #${id}:`, error);
      throw error;
    }
  }

  // JSONファイルに保存
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allPokemon, null, 2), "utf-8");

  const endTime = Date.now();
  const totalTime = ((endTime - startTime) / 1000).toFixed(1);

  console.log("\n=== Fetch Complete ===");
  console.log(`Total Pokemon: ${allPokemon.length}`);
  console.log(`Output file: ${OUTPUT_FILE}`);
  console.log(`Total time: ${totalTime}s`);
  console.log(`Average: ${(allPokemon.length / parseFloat(totalTime)).toFixed(2)} pokemon/sec`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
