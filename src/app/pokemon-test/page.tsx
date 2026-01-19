/**
 * ポケモン野球能力診断テストページ
 * 全コンポーネントを統合したデモページ
 */

"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { getAllPokemon } from "@/lib/services/pokemon-data";
import { calculateFielderAbility } from "@/lib/calculator/fielder";
import { calculatePitcherAbility } from "@/lib/calculator/pitcher";
import { getTopPositions } from "@/lib/evaluator/position";
import type { Pokemon } from "@/types";
import type { FielderAbility, PitcherAbility } from "@/types/ability";
import type { PositionFitness } from "@/types/position";

// UIコンポーネント
import { SearchBar } from "@/components/ui/SearchBar";
import { PokemonCard } from "@/components/ui/PokemonCard";
import { AbilityTabs } from "@/components/ui/AbilityTabs";
import { AbilityBars } from "@/components/ui/AbilityBars";
import { PositionRanking } from "@/components/ui/PositionRanking";
import { FIELDER_ABILITY_NAMES_JA } from "@/lib/calculator/fielder";
import { PITCHER_ABILITY_NAMES_JA } from "@/lib/calculator/pitcher";

export default function PokemonTestPage() {
  const [pokemonList, setPokemonList] = useState<Pokemon[]>([]);
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ポケモンリストを読み込み
  useEffect(() => {
    loadPokemonList();
  }, []);

  async function loadPokemonList() {
    setLoading(true);
    setError(null);

    try {
      const data = await getAllPokemon();
      setPokemonList(data);
      console.log("Loaded Pokemon:", data.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      console.error("Failed to load Pokemon:", err);
    } finally {
      setLoading(false);
    }
  }

  // ランダム選択
  function handleRandom() {
    if (pokemonList.length === 0) return;
    const randomIndex = Math.floor(Math.random() * pokemonList.length);
    setSelectedPokemon(pokemonList[randomIndex]);
  }

  // 野手能力を計算（メモ化）
  const fielderAbility = useMemo<FielderAbility | null>(() => {
    if (!selectedPokemon) return null;
    return calculateFielderAbility(selectedPokemon.stats);
  }, [selectedPokemon]);

  // 投手能力を計算（メモ化）
  const pitcherAbility = useMemo<PitcherAbility | null>(() => {
    if (!selectedPokemon) return null;
    return calculatePitcherAbility(selectedPokemon.stats);
  }, [selectedPokemon]);

  // ポジション適性を計算（メモ化）
  const topPositions = useMemo<PositionFitness[]>(() => {
    if (!fielderAbility || !pitcherAbility) return [];
    return getTopPositions(fielderAbility, pitcherAbility);
  }, [fielderAbility, pitcherAbility]);

  // 野手能力をバー表示用に変換
  const fielderAbilityBars = useMemo(() => {
    if (!fielderAbility) return [];
    return Object.entries(fielderAbility).map(([key, value]) => ({
      name: FIELDER_ABILITY_NAMES_JA[key as keyof FielderAbility],
      value,
    }));
  }, [fielderAbility]);

  // 投手能力をバー表示用に変換
  const pitcherAbilityBars = useMemo(() => {
    if (!pitcherAbility) return [];
    return Object.entries(pitcherAbility).map(([key, value]) => ({
      name: PITCHER_ABILITY_NAMES_JA[key as keyof PitcherAbility],
      value,
    }));
  }, [pitcherAbility]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-xl">ポケモンデータを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center text-red-600">
          <p className="text-xl font-bold">エラーが発生しました</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* ヘッダー */}
      <header className="bg-green-600 text-white py-6 shadow-lg">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-2 bg-green-700 hover:bg-green-800 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span className="text-sm font-medium">トップへ</span>
            </Link>
            <div className="flex-1 text-center">
              <h1 className="text-3xl md:text-4xl font-bold">PokeBase 野球能力診断</h1>
              <p className="mt-1 text-green-100 text-sm">
                ポケモンの種族値から野球選手としての能力を診断！
              </p>
            </div>
            <div className="w-24" /> {/* バランス用スペーサー */}
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* 検索バー */}
        <div className="mb-8 flex justify-center">
          <SearchBar
            pokemonList={pokemonList}
            onSelect={setSelectedPokemon}
            onRandom={handleRandom}
          />
        </div>

        {/* ステータス表示 */}
        <div className="mb-8 flex justify-center">
          <div className="bg-blue-100 px-4 py-2 rounded">
            <p className="text-sm font-semibold">取得済み: {pokemonList.length} / 1025匹</p>
          </div>
        </div>

        {/* ポケモン選択前の状態 */}
        {!selectedPokemon && (
          <div className="text-center py-20">
            <p className="text-2xl text-gray-500">
              ポケモンを検索して選択するか、ランダムボタンを押してください
            </p>
          </div>
        )}

        {/* ポケモン選択後の表示 */}
        {selectedPokemon && (
          <div className="space-y-8">
            {/* ポケモン情報カード */}
            <PokemonCard pokemon={selectedPokemon} />

            {/* ポジション適性ランキング */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">🏆 適性ポジション TOP3</h2>
              <PositionRanking positions={topPositions} />
            </div>

            {/* 野手/投手能力タブ */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">📊 詳細能力値</h2>
              <AbilityTabs
                fielderContent={
                  <div>
                    <p className="text-sm text-gray-600 mb-4">
                      種族値から計算された野手としての能力値です
                    </p>
                    <AbilityBars abilities={fielderAbilityBars} />
                  </div>
                }
                pitcherContent={
                  <div>
                    <p className="text-sm text-gray-600 mb-4">
                      種族値から計算された投手としての能力値です
                    </p>
                    <AbilityBars abilities={pitcherAbilityBars} />
                  </div>
                }
              />
            </div>

            {/* 種族値表示 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">📈 種族値</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="border rounded p-3">
                  <p className="text-sm text-gray-600">HP</p>
                  <p className="text-2xl font-bold">{selectedPokemon.stats.hp}</p>
                </div>
                <div className="border rounded p-3">
                  <p className="text-sm text-gray-600">攻撃</p>
                  <p className="text-2xl font-bold">{selectedPokemon.stats.attack}</p>
                </div>
                <div className="border rounded p-3">
                  <p className="text-sm text-gray-600">防御</p>
                  <p className="text-2xl font-bold">{selectedPokemon.stats.defense}</p>
                </div>
                <div className="border rounded p-3">
                  <p className="text-sm text-gray-600">特攻</p>
                  <p className="text-2xl font-bold">{selectedPokemon.stats.specialAttack}</p>
                </div>
                <div className="border rounded p-3">
                  <p className="text-sm text-gray-600">特防</p>
                  <p className="text-2xl font-bold">{selectedPokemon.stats.specialDefense}</p>
                </div>
                <div className="border rounded p-3">
                  <p className="text-sm text-gray-600">素早さ</p>
                  <p className="text-2xl font-bold">{selectedPokemon.stats.speed}</p>
                </div>
              </div>

              {/* 合計種族値 */}
              <div className="mt-6 pt-6 border-t">
                <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-500 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">合計種族値</p>
                  <p className="text-4xl font-bold text-green-700">
                    {selectedPokemon.stats.hp +
                      selectedPokemon.stats.attack +
                      selectedPokemon.stats.defense +
                      selectedPokemon.stats.specialAttack +
                      selectedPokemon.stats.specialDefense +
                      selectedPokemon.stats.speed}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* フッター */}
      <footer className="bg-gray-800 text-white py-6 mt-20">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm">PokeBase - ポケモンの野球能力診断アプリ</p>
          <p className="text-xs text-gray-400 mt-2">
            データ提供: PokeAPI | 第1-9世代（1025匹）対応
          </p>
        </div>
      </footer>
    </div>
  );
}
