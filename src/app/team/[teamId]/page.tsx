/**
 * チーム詳細ページ
 * チーム情報とメンバー一覧を表示
 */

"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import type { Pokemon } from "@/types";
import type { Team, TeamMemberWithPokemon } from "@/types/team";
import type { Position } from "@/types/position";
import { getTeamById, getTeamMembers } from "@/lib/supabase/team";
import { getAllPokemon } from "@/lib/services/pokemon-data";
import { TeamMemberCard } from "@/components/team/TeamMemberCard";

// ポジションの表示順序
const POSITION_ORDER: Position[] = [
  "pitcher",
  "catcher",
  "first",
  "second",
  "third",
  "short",
  "left",
  "center",
  "right",
];

interface TeamDetailPageProps {
  params: Promise<{ teamId: string }>;
}

export default function TeamDetailPage({ params }: TeamDetailPageProps) {
  const { teamId } = use(params);
  const [team, setTeam] = useState<Team | null>(null);
  const [membersWithPokemon, setMembersWithPokemon] = useState<TeamMemberWithPokemon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTeamData() {
      try {
        // チーム情報を取得
        const { data: teamData, error: teamError } = await getTeamById(teamId);
        if (teamError) {
          throw teamError;
        }
        if (!teamData) {
          throw new Error("チームが見つかりません");
        }
        setTeam(teamData);

        // メンバー情報を取得
        const { data: members, error: membersError } = await getTeamMembers(teamId);
        if (membersError) {
          throw membersError;
        }

        // ポケモンデータを取得してメンバーに紐付け
        const allPokemon = await getAllPokemon();
        const pokemonMap = new Map<number, Pokemon>();
        allPokemon.forEach((p) => pokemonMap.set(p.id, p));

        const membersWithPokemonData: TeamMemberWithPokemon[] = [];
        for (const member of members) {
          const pokemon = pokemonMap.get(member.pokemon_id);
          if (pokemon) {
            membersWithPokemonData.push({
              ...member,
              pokemon,
            });
          }
        }

        // ポジション順にソート
        membersWithPokemonData.sort((a, b) => {
          const orderA = POSITION_ORDER.indexOf(a.position as Position);
          const orderB = POSITION_ORDER.indexOf(b.position as Position);
          return orderA - orderB;
        });

        setMembersWithPokemon(membersWithPokemonData);
      } catch (err) {
        console.error("Failed to load team:", err);
        setError(err instanceof Error ? err.message : "チームの読み込みに失敗しました");
      } finally {
        setIsLoading(false);
      }
    }

    loadTeamData();
  }, [teamId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/" className="text-green-600 hover:underline">
            ホームに戻る
          </Link>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">チームが見つかりません</p>
          <Link href="/" className="text-green-600 hover:underline">
            ホームに戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/" className="p-2 hover:bg-white rounded-full transition-colors">
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{team.team_name}</h1>
            <p className="text-sm text-gray-500">
              作成日: {new Date(team.created_at).toLocaleDateString("ja-JP")}
            </p>
          </div>
        </div>

        {/* メンバー一覧 */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-800">メンバー一覧</h2>
          {membersWithPokemon.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center">
              <p className="text-gray-500">メンバーがいません</p>
            </div>
          ) : (
            <div className="space-y-4">
              {membersWithPokemon.map((member) => (
                <TeamMemberCard
                  key={member.id}
                  position={member.position as Position}
                  pokemon={member.pokemon}
                />
              ))}
            </div>
          )}
        </div>

        {/* チーム統計（将来的な機能） */}
        <div className="mt-8 bg-white rounded-lg p-4 shadow-sm">
          <h3 className="font-semibold text-gray-700 mb-2">チーム情報</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">メンバー数:</span>
              <span className="ml-2 font-semibold">{membersWithPokemon.length}人</span>
            </div>
            <div>
              <span className="text-gray-500">評判:</span>
              <span className="ml-2 font-semibold">{team.reputation}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
