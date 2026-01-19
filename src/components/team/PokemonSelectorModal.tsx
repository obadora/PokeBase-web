/**
 * ポケモン選択モーダルコンポーネント
 * SearchBarを再利用してポケモンを選択
 * 指定ポジションに適性があるポケモンのみ表示
 */

"use client";

import { useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import type { Pokemon } from "@/types";
import type { Position } from "@/types/position";
import { POSITION_NAMES_JA } from "@/types/position";
import { SearchBar } from "@/components/ui/SearchBar";
import { filterPokemonByPosition } from "@/lib/utils/team-builder";

interface PokemonSelectorModalProps {
  isOpen: boolean;
  position: Position;
  pokemonList: Pokemon[];
  selectedPokemonIds: number[];
  onSelect: (pokemon: Pokemon) => void;
  onClose: () => void;
}

export function PokemonSelectorModal({
  isOpen,
  position,
  pokemonList,
  selectedPokemonIds,
  onSelect,
  onClose,
}: PokemonSelectorModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // ESCキーでモーダルを閉じる
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  // モーダル外クリックで閉じる
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  // 指定ポジションに適性があり、かつ未選択のポケモンをフィルタリング
  const eligiblePokemon = useMemo(() => {
    return filterPokemonByPosition(pokemonList, position, selectedPokemonIds);
  }, [pokemonList, position, selectedPokemonIds]);

  const handleSelect = (pokemon: Pokemon) => {
    onSelect(pokemon);
    onClose();
  };

  const handleRandom = () => {
    if (eligiblePokemon.length > 0) {
      const randomIndex = Math.floor(Math.random() * eligiblePokemon.length);
      handleSelect(eligiblePokemon[randomIndex]);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden"
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-bold">{POSITION_NAMES_JA[position]}を選択</h2>
            <p className="text-sm text-gray-500">適性のあるポケモン: {eligiblePokemon.length}匹</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg
              className="w-6 h-6 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 検索バー */}
        <div className="p-4 border-b">
          <SearchBar
            pokemonList={eligiblePokemon}
            onSelect={handleSelect}
            onRandom={handleRandom}
          />
        </div>

        {/* 適性のあるポケモン一覧 */}
        <div className="p-4 overflow-y-auto max-h-80">
          <p className="text-sm text-gray-600 mb-3">
            {POSITION_NAMES_JA[position]}に向いているポケモン
          </p>
          {eligiblePokemon.length === 0 ? (
            <p className="text-center text-gray-400 py-4">適性のあるポケモンがいません</p>
          ) : (
            <div className="grid grid-cols-5 gap-2">
              {eligiblePokemon.slice(0, 20).map((pokemon) => (
                <button
                  key={pokemon.id}
                  onClick={() => handleSelect(pokemon)}
                  className="flex flex-col items-center p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {pokemon.sprites.frontDefault && (
                    <Image
                      src={pokemon.sprites.frontDefault}
                      alt={pokemon.nameJa || pokemon.name}
                      width={48}
                      height={48}
                      className="w-12 h-12"
                    />
                  )}
                  <span className="text-xs text-gray-700 truncate max-w-full">
                    {pokemon.nameJa || pokemon.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
