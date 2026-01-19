/**
 * メンバー選択パネルコンポーネント
 * 6人のメンバーを選択するためのパネル
 */

"use client";

import { useState } from "react";
import type { Pokemon } from "@/types";
import type { Position } from "@/types/position";
import type { MemberSlotState } from "@/types/team";
import { POSITION_CATEGORIES, POSITION_CATEGORY_NAMES_JA, DEFAULT_TEAM_RULES } from "@/types/team";
import { MemberSlot } from "./MemberSlot";
import { PokemonSelectorModal } from "./PokemonSelectorModal";

interface MemberSelectionPanelProps {
  pokemonList: Pokemon[];
  members: MemberSlotState[];
  onMemberChange: (position: Position, pokemon: Pokemon | null) => void;
  /** 上級生等で使用済みのポケモンID（選択不可） */
  excludePokemonIds?: number[];
}

export function MemberSelectionPanel({
  pokemonList,
  members,
  onMemberChange,
  excludePokemonIds = [],
}: MemberSelectionPanelProps) {
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);

  // ポジションからメンバー状態を取得
  const getMemberByPosition = (position: Position): MemberSlotState | undefined => {
    return members.find((m) => m.position === position);
  };

  // 選択済みポケモンのIDリストを取得（上級生の除外IDを含む）
  const getSelectedPokemonIds = (): number[] => {
    const currentMembers = members.filter((m) => m.pokemon).map((m) => m.pokemon!.id);
    return [...currentMembers, ...excludePokemonIds];
  };

  // カテゴリごとの選択済み人数をカウント
  const countSelectedByCategory = (category: "battery" | "infield" | "outfield"): number => {
    const positions = POSITION_CATEGORIES[category];
    return members.filter((m) => positions.includes(m.position) && m.pokemon !== null).length;
  };

  // スロットがクリックされたときの処理
  const handleSlotClick = (position: Position) => {
    const member = getMemberByPosition(position);

    // すでにポケモンが選択されている場合は解除の確認
    if (member?.pokemon) {
      onMemberChange(position, null);
    } else {
      setSelectedPosition(position);
    }
  };

  // ポケモンが選択されたときの処理
  const handlePokemonSelect = (pokemon: Pokemon) => {
    if (selectedPosition) {
      onMemberChange(selectedPosition, pokemon);
    }
  };

  // モーダルを閉じる
  const handleCloseModal = () => {
    setSelectedPosition(null);
  };

  // 合計選択済み人数
  const totalSelected = members.filter((m) => m.pokemon).length;

  // 内野と外野の選択状態の説明
  const infieldCount = countSelectedByCategory("infield");
  const outfieldCount = countSelectedByCategory("outfield");

  return (
    <div className="space-y-6">
      {/* バッテリー */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="font-bold text-gray-800">{POSITION_CATEGORY_NAMES_JA.battery}</h3>
          <span className="text-sm text-red-500">（必須）</span>
        </div>
        <div className="flex gap-3">
          {POSITION_CATEGORIES.battery.map((position) => {
            const member = getMemberByPosition(position);
            return (
              <MemberSlot
                key={position}
                position={position}
                pokemon={member?.pokemon || null}
                isRequired={true}
                isSelected={selectedPosition === position}
                onClick={() => handleSlotClick(position)}
              />
            );
          })}
        </div>
      </div>

      {/* 内野手 */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="font-bold text-gray-800">{POSITION_CATEGORY_NAMES_JA.infield}</h3>
          <span className="text-sm text-gray-500">
            （{DEFAULT_TEAM_RULES.infield.min}〜{DEFAULT_TEAM_RULES.infield.max}
            人選択 / 現在: {infieldCount}人）
          </span>
        </div>
        <div className="flex flex-wrap gap-3">
          {POSITION_CATEGORIES.infield.map((position) => {
            const member = getMemberByPosition(position);
            return (
              <MemberSlot
                key={position}
                position={position}
                pokemon={member?.pokemon || null}
                isRequired={false}
                isSelected={selectedPosition === position}
                onClick={() => handleSlotClick(position)}
              />
            );
          })}
        </div>
      </div>

      {/* 外野手 */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="font-bold text-gray-800">{POSITION_CATEGORY_NAMES_JA.outfield}</h3>
          <span className="text-sm text-gray-500">
            （{DEFAULT_TEAM_RULES.outfield.min}〜{DEFAULT_TEAM_RULES.outfield.max}
            人選択 / 現在: {outfieldCount}人）
          </span>
        </div>
        <div className="flex flex-wrap gap-3">
          {POSITION_CATEGORIES.outfield.map((position) => {
            const member = getMemberByPosition(position);
            return (
              <MemberSlot
                key={position}
                position={position}
                pokemon={member?.pokemon || null}
                isRequired={false}
                isSelected={selectedPosition === position}
                onClick={() => handleSlotClick(position)}
              />
            );
          })}
        </div>
      </div>

      {/* 選択状況サマリー */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-700">
            選択済み: <span className="font-bold">{totalSelected}</span>/
            {DEFAULT_TEAM_RULES.maxMembers}人
          </span>
          {totalSelected === DEFAULT_TEAM_RULES.maxMembers && (
            <span className="text-green-600 font-semibold">準備完了!</span>
          )}
        </div>
      </div>

      {/* ポケモン選択モーダル */}
      {selectedPosition && (
        <PokemonSelectorModal
          isOpen={selectedPosition !== null}
          position={selectedPosition}
          pokemonList={pokemonList}
          selectedPokemonIds={getSelectedPokemonIds()}
          onSelect={handlePokemonSelect}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
