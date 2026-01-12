/**
 * 共通の型定義
 */

/** ポケモンのタイプ */
export type PokemonTypeInfo = {
  slot: number;
  typeName: string; // 'grass', 'fire', etc.
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
