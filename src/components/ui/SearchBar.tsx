/**
 * 検索バーコンポーネント
 * ポケモン検索とランダム選択機能を提供
 */

"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import type { Pokemon } from "@/types";
import { normalizeKana } from "@/lib/utils/kana";

interface SearchBarProps {
  pokemonList: Pokemon[];
  onSelect: (pokemon: Pokemon) => void;
  onRandom: () => void;
}

export function SearchBar({ pokemonList, onSelect, onRandom }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Pokemon[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // クリック外側を検出してサジェストを閉じる
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 検索クエリが変更されたときにサジェストを更新
  useEffect(() => {
    if (query.trim() === "") {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // 検索クエリを正規化（ひらがな/カタカナを統一）
    const normalizedQuery = normalizeKana(query);

    const filtered = pokemonList.filter((p) => {
      // 英語名での検索
      if (p.name.toLowerCase().includes(query.toLowerCase())) {
        return true;
      }

      // 図鑑番号での検索
      if (p.id.toString() === query) {
        return true;
      }

      // 日本語名での検索（カタカナ/ひらがな両対応）
      if (p.nameJa) {
        const normalizedNameJa = normalizeKana(p.nameJa);
        if (normalizedNameJa.includes(normalizedQuery)) {
          return true;
        }
      }

      return false;
    });

    setSuggestions(filtered.slice(0, 10)); // 最大10件
    setShowSuggestions(true);
  }, [query, pokemonList]);

  const handleSelect = (pokemon: Pokemon) => {
    setQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    onSelect(pokemon);
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-2xl">
      <div className="flex gap-2">
        {/* 検索入力 */}
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ポケモンを検索（ひらがな・カタカナ・英語名・図鑑番号）"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          {/* サジェストリスト */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-y-auto">
              {suggestions.map((pokemon) => (
                <button
                  key={pokemon.id}
                  onClick={() => handleSelect(pokemon)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3"
                >
                  {pokemon.sprites.frontDefault && (
                    <Image
                      src={pokemon.sprites.frontDefault}
                      alt={pokemon.name}
                      width={40}
                      height={40}
                      className="w-10 h-10"
                    />
                  )}
                  <div>
                    <p className="font-semibold">
                      #{pokemon.id.toString().padStart(3, "0")} {pokemon.nameJa || pokemon.name}
                    </p>
                    {pokemon.nameJa && <p className="text-sm text-gray-500">{pokemon.name}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ランダム選択ボタン */}
        <button
          onClick={onRandom}
          className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
        >
          ランダム
        </button>
      </div>
    </div>
  );
}
