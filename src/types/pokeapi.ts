/**
 * PokeAPI v2のレスポンス型定義
 * @see https://pokeapi.co/docs/v2
 */

/** 名前付きリソースの基本型 */
export type NamedAPIResource = {
  name: string;
  url: string;
};

/** ポケモンタイプ */
export type PokemonType = {
  slot: number;
  type: NamedAPIResource;
};

/** ポケモンステータス */
export type PokemonStat = {
  base_stat: number;
  effort: number;
  stat: NamedAPIResource;
};

/** ポケモンの特性 */
export type PokemonAbility = {
  is_hidden: boolean;
  slot: number;
  ability: NamedAPIResource;
};

/** ポケモンスプライト */
export type PokemonSprites = {
  front_default: string | null;
  front_shiny: string | null;
  front_female: string | null;
  front_shiny_female: string | null;
  back_default: string | null;
  back_shiny: string | null;
  back_female: string | null;
  back_shiny_female: string | null;
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
};

/** PokeAPI Pokemon レスポンス型 */
export type PokeAPIPokemonResponse = {
  id: number;
  name: string;
  nameJa?: string; // スクリプトで追加された日本語名（オプショナル）
  base_experience: number | null;
  height: number;
  weight: number;
  is_default: boolean;
  order: number;
  abilities: PokemonAbility[];
  types: PokemonType[];
  stats: PokemonStat[];
  sprites: PokemonSprites;
  species: NamedAPIResource;
};
