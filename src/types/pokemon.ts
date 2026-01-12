/**
 * ポケモン型定義（統合版）
 * 既存のindex.tsとpokeapi.tsの内容を統合し、基本設計に準拠
 */

/** ポケモンタイプ */
export interface PokemonType {
  slot: number;
  type: {
    name: string; // 英語名
    nameJa?: string; // 日本語名
  };
}

/** ポケモンのステータス（種族値） */
export interface Stats {
  hp: number; // HP
  attack: number; // こうげき
  defense: number; // ぼうぎょ
  specialAttack: number; // とくこう
  specialDefense: number; // とくぼう
  speed: number; // すばやさ
}

/** ポケモンのスプライト画像 */
export interface PokemonSprites {
  frontDefault: string | null;
  frontShiny: string | null;
  frontFemale: string | null;
  frontShinyFemale: string | null;
  backDefault: string | null;
  backShiny: string | null;
  backFemale: string | null;
  backShinyFemale: string | null;
  other?: {
    "official-artwork"?: {
      front_default: string | null;
      front_shiny: string | null;
    };
    home?: {
      front_default: string | null;
      front_female: string | null;
      front_shiny: string | null;
      front_shiny_female: string | null;
    };
  };
}

/** ポケモン型（アプリケーション層） */
export interface Pokemon {
  id: number; // 図鑑番号
  name: string; // 英語名
  nameJa?: string; // 日本語名
  types: PokemonType[]; // タイプ
  stats: Stats; // 種族値
  sprites: PokemonSprites; // スプライト画像
  height: number; // 高さ（デシメートル単位）
  weight: number; // 重さ（ヘクトグラム単位）
  baseExperience: number | null; // 基礎経験値
  speciesUrl: string; // 種族情報URL
}
