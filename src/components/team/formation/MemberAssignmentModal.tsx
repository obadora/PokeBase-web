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
import { calculateFielderAbility } from "@/lib/calculator/fielder";
import { calculatePitcherAbility } from "@/lib/calculator/pitcher";
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

  // メンバーの適性スコアを計算
  const membersWithFitness = useMemo(() => {
    return availableMembers.map((member) => {
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
        member,
        fitness: positionFitness,
        isEligible: positionFitness ? positionFitness.rank <= 3 : false,
      };
    });
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

        {/* ベンチに戻すボタン */}
        {currentMember && (
          <div className="p-4 border-b bg-gray-50">
            <button
              type="button"
              onClick={() => {
                onRemove();
                onClose();
              }}
              className="w-full py-2 px-4 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition-colors text-sm font-medium"
            >
              {currentMember.pokemon.nameJa || currentMember.pokemon.name}をベンチに戻す
            </button>
          </div>
        )}

        {/* メンバー一覧 */}
        <div className="p-4 overflow-y-auto max-h-80">
          {sortedMembers.length === 0 ? (
            <p className="text-center text-gray-400 py-4">配置可能なメンバーがいません</p>
          ) : (
            <div className="space-y-2">
              {sortedMembers.map(({ member, fitness, isEligible }) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => {
                    onAssign(member);
                    onClose();
                  }}
                  className={`
                    w-full flex items-center gap-3 p-3 rounded-lg border transition-all
                    ${isEligible ? "border-green-300 hover:bg-green-50" : "border-gray-200 hover:bg-gray-50"}
                  `}
                >
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
                  <div className="flex-grow text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">
                        {member.pokemon.nameJa || member.pokemon.name}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
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
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
