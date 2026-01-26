/**
 * メンバー割り当てモーダルコンポーネント
 * ポジションにメンバーを配置するためのモーダル
 */

"use client";

import { useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import type { Position } from "@/types/position";
import type { TeamMemberWithPokemon } from "@/types/team";
import { POSITION_NAMES_JA } from "@/types/position";
import { GRADE_NAMES_JA } from "@/types/team";
import { calculateFielderAbility, FIELDER_ABILITY_NAMES_JA } from "@/lib/calculator/fielder";
import { calculatePitcherAbility, PITCHER_ABILITY_NAMES_JA } from "@/lib/calculator/pitcher";
import { evaluatePositions } from "@/lib/evaluator/position";

interface MemberAssignmentModalProps {
  isOpen: boolean;
  position: Position;
  availableMembers: TeamMemberWithPokemon[];
  currentMember: TeamMemberWithPokemon | null;
  onAssign: (member: TeamMemberWithPokemon) => void;
  onRemove: () => void;
  onClose: () => void;
}

export function MemberAssignmentModal({
  isOpen,
  position,
  availableMembers,
  currentMember,
  onAssign,
  onRemove,
  onClose,
}: MemberAssignmentModalProps) {
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

  // メンバーの適性スコアと能力値を計算する関数
  const calculateMemberAbilities = (member: TeamMemberWithPokemon) => {
    const stats = {
      hp: member.pokemon.stats.hp,
      attack: member.pokemon.stats.attack,
      defense: member.pokemon.stats.defense,
      specialAttack: member.pokemon.stats.specialAttack,
      specialDefense: member.pokemon.stats.specialDefense,
      speed: member.pokemon.stats.speed,
    };

    const fielderAbility = calculateFielderAbility(stats);
    const pitcherAbility = calculatePitcherAbility(stats);
    const allFitness = evaluatePositions(fielderAbility, pitcherAbility);
    const positionFitness = allFitness.find((f) => f.position === position);

    return {
      fielderAbility,
      pitcherAbility,
      fitness: positionFitness,
      isEligible: positionFitness ? positionFitness.rank <= 3 : false,
    };
  };

  // 現在配置されているメンバーの能力値
  const currentMemberAbilities = useMemo(() => {
    if (!currentMember) return null;
    return calculateMemberAbilities(currentMember);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMember, position]);

  // 控えメンバーの適性スコアと能力値を計算
  const membersWithFitness = useMemo(() => {
    return availableMembers.map((member) => {
      const abilities = calculateMemberAbilities(member);
      return {
        member,
        ...abilities,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableMembers, position]);

  // 適性順でソート（適性あり → スコア降順）
  const sortedMembers = useMemo(() => {
    return [...membersWithFitness].sort((a, b) => {
      // 適性ありを優先
      if (a.isEligible && !b.isEligible) return -1;
      if (!a.isEligible && b.isEligible) return 1;

      // スコア降順
      const scoreA = a.fitness?.score ?? 0;
      const scoreB = b.fitness?.score ?? 0;
      return scoreB - scoreA;
    });
  }, [membersWithFitness]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-hidden"
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-bold">{POSITION_NAMES_JA[position]}を配置</h2>
            <p className="text-sm text-gray-500">
              {currentMember
                ? `現在: ${currentMember.pokemon.nameJa || currentMember.pokemon.name}`
                : "未配置"}
            </p>
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

        {/* 現在配置されているメンバー */}
        {currentMember && currentMemberAbilities && (
          <div className="p-4 border-b bg-blue-50">
            <p className="text-xs text-blue-600 font-medium mb-2">現在の配置</p>
            <div className="bg-white rounded-lg border border-blue-200 p-3">
              <div className="flex items-center gap-3">
                {/* ポケモン画像 */}
                <div className="w-12 h-12 relative flex-shrink-0">
                  {currentMember.pokemon.sprites.frontDefault && (
                    <Image
                      src={currentMember.pokemon.sprites.frontDefault}
                      alt={currentMember.pokemon.nameJa || currentMember.pokemon.name}
                      fill
                      sizes="48px"
                      className="object-contain"
                    />
                  )}
                </div>

                {/* メンバー情報 */}
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800 truncate">
                      {currentMember.pokemon.nameJa || currentMember.pokemon.name}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 flex-shrink-0">
                      {GRADE_NAMES_JA[currentMember.grade]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {currentMemberAbilities.fitness && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">適性:</span>
                        <span
                          className={`text-xs font-semibold ${currentMemberAbilities.isEligible ? "text-green-600" : "text-gray-400"}`}
                        >
                          {currentMemberAbilities.fitness.score}点
                        </span>
                      </div>
                    )}
                    {currentMemberAbilities.isEligible && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">
                        適性あり
                      </span>
                    )}
                  </div>
                </div>

                {/* 星表示 */}
                {currentMemberAbilities.fitness && (
                  <div className="flex-shrink-0">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }, (_, i) => (
                        <span
                          key={i}
                          className="text-sm"
                          style={{ opacity: i < currentMemberAbilities.fitness!.stars ? 1 : 0.2 }}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 能力値表示 */}
              <div className="mt-2 pt-2 border-t border-gray-100">
                {position === "pitcher" ? (
                  <div className="grid grid-cols-4 gap-1 text-[10px]">
                    <div className="text-center">
                      <div className="text-gray-400">{PITCHER_ABILITY_NAMES_JA.velocity}</div>
                      <div className="font-semibold text-gray-700">
                        {currentMemberAbilities.pitcherAbility.velocity}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-400">{PITCHER_ABILITY_NAMES_JA.control}</div>
                      <div className="font-semibold text-gray-700">
                        {currentMemberAbilities.pitcherAbility.control}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-400">{PITCHER_ABILITY_NAMES_JA.stamina}</div>
                      <div className="font-semibold text-gray-700">
                        {currentMemberAbilities.pitcherAbility.stamina}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-400">{PITCHER_ABILITY_NAMES_JA.breaking}</div>
                      <div className="font-semibold text-gray-700">
                        {currentMemberAbilities.pitcherAbility.breaking}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-5 gap-1 text-[10px]">
                    <div className="text-center">
                      <div className="text-gray-400">{FIELDER_ABILITY_NAMES_JA.meet}</div>
                      <div className="font-semibold text-gray-700">
                        {currentMemberAbilities.fielderAbility.meet}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-400">{FIELDER_ABILITY_NAMES_JA.power}</div>
                      <div className="font-semibold text-gray-700">
                        {currentMemberAbilities.fielderAbility.power}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-400">{FIELDER_ABILITY_NAMES_JA.speed}</div>
                      <div className="font-semibold text-gray-700">
                        {currentMemberAbilities.fielderAbility.speed}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-400">{FIELDER_ABILITY_NAMES_JA.arm}</div>
                      <div className="font-semibold text-gray-700">
                        {currentMemberAbilities.fielderAbility.arm}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-400">{FIELDER_ABILITY_NAMES_JA.defense}</div>
                      <div className="font-semibold text-gray-700">
                        {currentMemberAbilities.fielderAbility.defense}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ベンチに戻すボタン */}
            <button
              type="button"
              onClick={() => {
                onRemove();
                onClose();
              }}
              className="w-full mt-2 py-2 px-4 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition-colors text-sm font-medium"
            >
              ベンチに戻す
            </button>
          </div>
        )}

        {/* メンバー一覧 */}
        <div className="p-4 overflow-y-auto max-h-96">
          {sortedMembers.length === 0 ? (
            <p className="text-center text-gray-400 py-4">配置可能なメンバーがいません</p>
          ) : (
            <div className="space-y-2">
              {sortedMembers.map(
                ({ member, fitness, isEligible, fielderAbility, pitcherAbility }) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => {
                      onAssign(member);
                      onClose();
                    }}
                    className={`
                    w-full p-3 rounded-lg border transition-all text-left
                    ${isEligible ? "border-green-300 hover:bg-green-50" : "border-gray-200 hover:bg-gray-50"}
                  `}
                  >
                    <div className="flex items-center gap-3">
                      {/* ポケモン画像 */}
                      <div className="w-12 h-12 relative flex-shrink-0">
                        {member.pokemon.sprites.frontDefault && (
                          <Image
                            src={member.pokemon.sprites.frontDefault}
                            alt={member.pokemon.nameJa || member.pokemon.name}
                            fill
                            sizes="48px"
                            className="object-contain"
                          />
                        )}
                      </div>

                      {/* メンバー情報 */}
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800 truncate">
                            {member.pokemon.nameJa || member.pokemon.name}
                          </span>
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 flex-shrink-0">
                            {GRADE_NAMES_JA[member.grade]}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {/* 適性スコア */}
                          {fitness && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-500">適性:</span>
                              <span
                                className={`text-xs font-semibold ${isEligible ? "text-green-600" : "text-gray-400"}`}
                              >
                                {fitness.score}点
                              </span>
                            </div>
                          )}
                          {/* 適性バッジ */}
                          {isEligible && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">
                              適性あり
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 星表示 */}
                      {fitness && (
                        <div className="flex-shrink-0">
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }, (_, i) => (
                              <span
                                key={i}
                                className="text-sm"
                                style={{ opacity: i < fitness.stars ? 1 : 0.2 }}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 能力値表示 */}
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      {position === "pitcher" ? (
                        // 投手ポジションの場合は投手能力を表示
                        <div className="grid grid-cols-4 gap-1 text-[10px]">
                          <div className="text-center">
                            <div className="text-gray-400">{PITCHER_ABILITY_NAMES_JA.velocity}</div>
                            <div className="font-semibold text-gray-700">
                              {pitcherAbility.velocity}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-400">{PITCHER_ABILITY_NAMES_JA.control}</div>
                            <div className="font-semibold text-gray-700">
                              {pitcherAbility.control}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-400">{PITCHER_ABILITY_NAMES_JA.stamina}</div>
                            <div className="font-semibold text-gray-700">
                              {pitcherAbility.stamina}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-400">{PITCHER_ABILITY_NAMES_JA.breaking}</div>
                            <div className="font-semibold text-gray-700">
                              {pitcherAbility.breaking}
                            </div>
                          </div>
                        </div>
                      ) : (
                        // 野手ポジションの場合は野手能力を表示
                        <div className="grid grid-cols-5 gap-1 text-[10px]">
                          <div className="text-center">
                            <div className="text-gray-400">{FIELDER_ABILITY_NAMES_JA.meet}</div>
                            <div className="font-semibold text-gray-700">{fielderAbility.meet}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-400">{FIELDER_ABILITY_NAMES_JA.power}</div>
                            <div className="font-semibold text-gray-700">
                              {fielderAbility.power}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-400">{FIELDER_ABILITY_NAMES_JA.speed}</div>
                            <div className="font-semibold text-gray-700">
                              {fielderAbility.speed}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-400">{FIELDER_ABILITY_NAMES_JA.arm}</div>
                            <div className="font-semibold text-gray-700">{fielderAbility.arm}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-400">{FIELDER_ABILITY_NAMES_JA.defense}</div>
                            <div className="font-semibold text-gray-700">
                              {fielderAbility.defense}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </button>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
