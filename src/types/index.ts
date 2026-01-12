/**
 * 共通の型定義
 */

/** ポケモンのタイプ */
export type PokemonTypeInfo = {
  slot: number;
  typeName: string; // 'grass', 'fire', etc.
};

/** タイプの日本語名マッピング */
export const TYPE_NAMES_JA: Record<string, string> = {
  normal: "ノーマル",
  fire: "ほのお",
  water: "みず",
  electric: "でんき",
  grass: "くさ",
  ice: "こおり",
  fighting: "かくとう",
  poison: "どく",
  ground: "じめん",
  flying: "ひこう",
  psychic: "エスパー",
  bug: "むし",
  rock: "いわ",
  ghost: "ゴースト",
  dragon: "ドラゴン",
  dark: "あく",
  steel: "はがね",
  fairy: "フェアリー",
};

/** タイプの色マッピング（HEXカラー） */
export const TYPE_COLORS: Record<string, string> = {
  normal: "#9CA3AF",
  fire: "#F97316",
  water: "#3B82F6",
  electric: "#FACC15",
  grass: "#22C55E",
  ice: "#22D3EE",
  fighting: "#DC2626",
  poison: "#A855F7",
  ground: "#CA8A04",
  flying: "#818CF8",
  psychic: "#EC4899",
  bug: "#84CC16",
  rock: "#A16207",
  ghost: "#7C3AED",
  dragon: "#4F46E5",
  dark: "#374151",
  steel: "#6B7280",
  fairy: "#F9A8D4",
};

/** ポケモンのステータス */
export type PokemonStats = {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
};

/** ポケモンの特性 */
export type PokemonAbilityInfo = {
  name: string;
  isHidden: boolean;
  slot: number;
};

/** ポケモンのスプライト画像 */
export type PokemonSprite = {
  frontDefault: string | null;
  frontShiny: string | null;
  officialArtwork: string | null;
};

/** アプリケーションで使用するPokemon型 */
export type Pokemon = {
  id: number;
  name: string;
  nameJa?: string; // 日本語名（将来的に追加予定）
  height: number; // デシメートル単位
  weight: number; // ヘクトグラム単位
  baseExperience: number | null;
  types: PokemonTypeInfo[];
  stats: PokemonStats;
  abilities: PokemonAbilityInfo[];
  sprites: PokemonSprite;
  speciesUrl: string;
};

/** Base関連の型定義（今後実装予定） */
export type Base = {
  id: string;
  name: string;
  // 詳細は後で追加
};
