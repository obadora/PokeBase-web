/**
 * ポケモン情報カードコンポーネント
 * ポケモンの基本情報を表示
 */

"use client";

import Image from "next/image";
import type { Pokemon } from "@/types";

interface PokemonCardProps {
  pokemon: Pokemon;
}

export function PokemonCard({ pokemon }: PokemonCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-6">
        {/* ポケモン画像 */}
        <div className="flex-shrink-0">
          {pokemon.sprites.officialArtwork ? (
            <Image
              src={pokemon.sprites.officialArtwork}
              alt={pokemon.name}
              width={192}
              height={192}
              className="w-48 h-48 object-contain"
            />
          ) : (
            <div className="w-48 h-48 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-400">No Image</span>
            </div>
          )}
        </div>

        {/* ポケモン情報 */}
        <div className="flex-1">
          <div className="mb-4">
            <p className="text-sm text-gray-500">No.{pokemon.id.toString().padStart(3, "0")}</p>
            <h2 className="text-3xl font-bold text-gray-800">{pokemon.nameJa || pokemon.name}</h2>
            {pokemon.nameJa && <p className="text-lg text-gray-600">{pokemon.name}</p>}
          </div>

          {/* タイプ */}
          <div className="mb-4">
            <p className="text-sm font-semibold text-gray-700 mb-2">タイプ</p>
            <div className="flex gap-2">
              {pokemon.types.map((t) => (
                <span
                  key={t.slot}
                  className="px-4 py-1 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full text-sm font-semibold"
                >
                  {t.typeName}
                </span>
              ))}
            </div>
          </div>

          {/* サイズ情報 */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">高さ</p>
              <p className="font-semibold">{(pokemon.height / 10).toFixed(1)}m</p>
            </div>
            <div>
              <p className="text-gray-500">重さ</p>
              <p className="font-semibold">{(pokemon.weight / 10).toFixed(1)}kg</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
