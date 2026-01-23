/**
 * 試合関連のSupabase操作関数
 */

import { supabase } from "./client";
import type { MatchResultType } from "@/types/match";

/** 試合レコード型 */
export interface MatchRecord {
  id: string;
  tournament_id: string;
  opponent_name: string;
  result: MatchResultType;
  score: string;
  date: string;
}

/** 大会レコード型 */
export interface TournamentRecord {
  id: string;
  team_id: string;
  tournament_type: "district" | "regional" | "national";
  status: "in_progress" | "completed" | "failed";
  current_round: number;
  created_at: string;
}

/**
 * 大会を作成する
 * @param teamId チームID
 * @param tournamentType 大会タイプ
 * @returns 作成された大会
 */
export async function createTournament(
  teamId: string,
  tournamentType: "district" | "regional" | "national"
): Promise<{ data: TournamentRecord | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("tournaments")
    .insert({
      team_id: teamId,
      tournament_type: tournamentType,
      status: "in_progress",
      current_round: 1,
    })
    .select()
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return { data: data as TournamentRecord, error: null };
}

/**
 * 大会を取得する
 * @param tournamentId 大会ID
 * @returns 大会
 */
export async function getTournamentById(
  tournamentId: string
): Promise<{ data: TournamentRecord | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("tournaments")
    .select("*")
    .eq("id", tournamentId)
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return { data: data as TournamentRecord, error: null };
}

/**
 * チームの大会一覧を取得する
 * @param teamId チームID
 * @returns 大会一覧
 */
export async function getTeamTournaments(
  teamId: string
): Promise<{ data: TournamentRecord[]; error: Error | null }> {
  const { data, error } = await supabase
    .from("tournaments")
    .select("*")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });

  if (error) {
    return { data: [], error: new Error(error.message) };
  }

  return { data: data as TournamentRecord[], error: null };
}

/**
 * 大会の状態を更新する
 * @param tournamentId 大会ID
 * @param status 状態
 * @param currentRound 現在のラウンド
 * @returns 更新された大会
 */
export async function updateTournamentStatus(
  tournamentId: string,
  status: TournamentRecord["status"],
  currentRound?: number
): Promise<{ data: TournamentRecord | null; error: Error | null }> {
  const updateData: Partial<TournamentRecord> = { status };
  if (currentRound !== undefined) {
    updateData.current_round = currentRound;
  }

  const { data, error } = await supabase
    .from("tournaments")
    .update(updateData)
    .eq("id", tournamentId)
    .select()
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return { data: data as TournamentRecord, error: null };
}

/**
 * 試合結果を保存する
 * @param tournamentId 大会ID
 * @param opponentName 対戦相手名
 * @param result 結果
 * @param score スコア（例: "5-3"）
 * @returns 保存された試合
 */
export async function saveMatchResult(
  tournamentId: string,
  opponentName: string,
  result: MatchResultType,
  score: string
): Promise<{ data: MatchRecord | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("matches")
    .insert({
      tournament_id: tournamentId,
      opponent_name: opponentName,
      result,
      score,
    })
    .select()
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return { data: data as MatchRecord, error: null };
}

/**
 * 大会の試合一覧を取得する
 * @param tournamentId 大会ID
 * @returns 試合一覧
 */
export async function getTournamentMatches(
  tournamentId: string
): Promise<{ data: MatchRecord[]; error: Error | null }> {
  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .eq("tournament_id", tournamentId)
    .order("date", { ascending: true });

  if (error) {
    return { data: [], error: new Error(error.message) };
  }

  return { data: data as MatchRecord[], error: null };
}

/**
 * チームの全試合履歴を取得する
 * @param teamId チームID
 * @returns 試合一覧（大会情報付き）
 */
export async function getTeamMatchHistory(teamId: string): Promise<{
  data: (MatchRecord & { tournament: TournamentRecord })[];
  error: Error | null;
}> {
  // まずチームの大会を取得
  const { data: tournaments, error: tourError } = await getTeamTournaments(teamId);

  if (tourError) {
    return { data: [], error: tourError };
  }

  // 各大会の試合を取得
  const allMatches: (MatchRecord & { tournament: TournamentRecord })[] = [];

  for (const tournament of tournaments) {
    const { data: matches, error: matchError } = await getTournamentMatches(tournament.id);

    if (matchError) {
      return { data: [], error: matchError };
    }

    for (const match of matches) {
      allMatches.push({ ...match, tournament });
    }
  }

  // 日付で降順ソート
  allMatches.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return { data: allMatches, error: null };
}

/**
 * 練習試合用の仮大会を作成または取得する
 * @param teamId チームID
 * @returns 練習試合用大会
 */
export async function getOrCreatePracticeMatch(
  teamId: string
): Promise<{ data: TournamentRecord | null; error: Error | null }> {
  // 進行中の地区大会があるか確認（練習試合は地区大会として扱う）
  const { data: existing } = await supabase
    .from("tournaments")
    .select("*")
    .eq("team_id", teamId)
    .eq("tournament_type", "district")
    .eq("status", "in_progress")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (existing) {
    return { data: existing as TournamentRecord, error: null };
  }

  // なければ新規作成
  return createTournament(teamId, "district");
}
