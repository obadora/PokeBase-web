/**
 * チーム関連のSupabase操作関数
 */

import { supabase } from "./client";
import type { Team, TeamMember, Grade } from "@/types/team";
import type { Position } from "@/types/position";

/**
 * チームを作成する
 * @param userId ユーザーID
 * @param teamName チーム名
 * @returns 作成されたチーム
 */
export async function createTeam(
  userId: string,
  teamName: string
): Promise<{ data: Team | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("teams")
    .insert({
      user_id: userId,
      team_name: teamName,
      reputation: 0,
    })
    .select()
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return { data: data as Team, error: null };
}

/**
 * ユーザーのチーム一覧を取得する
 * @param userId ユーザーID
 * @returns チーム一覧
 */
export async function getUserTeams(userId: string): Promise<{ data: Team[]; error: Error | null }> {
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return { data: [], error: new Error(error.message) };
  }

  return { data: data as Team[], error: null };
}

/**
 * チームをIDで取得する
 * @param teamId チームID
 * @returns チーム
 */
export async function getTeamById(
  teamId: string
): Promise<{ data: Team | null; error: Error | null }> {
  const { data, error } = await supabase.from("teams").select("*").eq("id", teamId).single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return { data: data as Team, error: null };
}

/**
 * チームメンバーを追加する
 * @param teamId チームID
 * @param pokemonId ポケモンID
 * @param position ポジション
 * @param isStarter スタメンかどうか
 * @returns 追加されたメンバー
 */
export async function addTeamMember(
  teamId: string,
  pokemonId: number,
  position: Position,
  isStarter: boolean = true
): Promise<{ data: TeamMember | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("team_members")
    .insert({
      team_id: teamId,
      pokemon_id: pokemonId,
      position: position,
      is_starter: isStarter,
    })
    .select()
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return { data: data as TeamMember, error: null };
}

/**
 * チームメンバーを一括追加する
 * @param teamId チームID
 * @param members メンバー情報の配列
 * @returns 追加されたメンバー一覧
 */
export async function addTeamMembers(
  teamId: string,
  members: { pokemonId: number; position: Position | string; isStarter?: boolean; grade?: Grade }[]
): Promise<{ data: TeamMember[]; error: Error | null }> {
  const insertData = members.map((m) => ({
    team_id: teamId,
    pokemon_id: m.pokemonId,
    position: m.position,
    is_starter: m.isStarter ?? true,
    grade: m.grade ?? 1,
  }));

  const { data, error } = await supabase.from("team_members").insert(insertData).select();

  if (error) {
    return { data: [], error: new Error(error.message) };
  }

  return { data: data as TeamMember[], error: null };
}

/**
 * チームメンバーを取得する
 * @param teamId チームID
 * @returns メンバー一覧（学年順でソート）
 */
export async function getTeamMembers(
  teamId: string
): Promise<{ data: TeamMember[]; error: Error | null }> {
  const { data, error } = await supabase
    .from("team_members")
    .select("*")
    .eq("team_id", teamId)
    .order("grade", { ascending: false }) // 3年→2年→1年の順
    .order("position", { ascending: true });

  if (error) {
    return { data: [], error: new Error(error.message) };
  }

  return { data: data as TeamMember[], error: null };
}

/**
 * 学年別にチームメンバーを取得する
 * @param teamId チームID
 * @param grade 学年
 * @returns メンバー一覧
 */
export async function getTeamMembersByGrade(
  teamId: string,
  grade: Grade
): Promise<{ data: TeamMember[]; error: Error | null }> {
  const { data, error } = await supabase
    .from("team_members")
    .select("*")
    .eq("team_id", teamId)
    .eq("grade", grade);

  if (error) {
    return { data: [], error: new Error(error.message) };
  }

  return { data: data as TeamMember[], error: null };
}

/**
 * チームメンバーを更新する
 * @param memberId メンバーID
 * @param updates 更新内容
 * @returns 更新されたメンバー
 */
export async function updateTeamMember(
  memberId: string,
  updates: { pokemonId?: number; position?: Position; isStarter?: boolean }
): Promise<{ data: TeamMember | null; error: Error | null }> {
  const updateData: Record<string, unknown> = {};
  if (updates.pokemonId !== undefined) updateData.pokemon_id = updates.pokemonId;
  if (updates.position !== undefined) updateData.position = updates.position;
  if (updates.isStarter !== undefined) updateData.is_starter = updates.isStarter;

  const { data, error } = await supabase
    .from("team_members")
    .update(updateData)
    .eq("id", memberId)
    .select()
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return { data: data as TeamMember, error: null };
}

/**
 * チームメンバーを削除する
 * @param memberId メンバーID
 * @returns 成功したかどうか
 */
export async function removeTeamMember(
  memberId: string
): Promise<{ success: boolean; error: Error | null }> {
  const { error } = await supabase.from("team_members").delete().eq("id", memberId);

  if (error) {
    return { success: false, error: new Error(error.message) };
  }

  return { success: true, error: null };
}

/**
 * チームを削除する（メンバーも一緒に削除される前提）
 * @param teamId チームID
 * @returns 成功したかどうか
 */
export async function deleteTeam(
  teamId: string
): Promise<{ success: boolean; error: Error | null }> {
  // まずメンバーを削除
  const { error: memberError } = await supabase.from("team_members").delete().eq("team_id", teamId);

  if (memberError) {
    return { success: false, error: new Error(memberError.message) };
  }

  // チームを削除
  const { error: teamError } = await supabase.from("teams").delete().eq("id", teamId);

  if (teamError) {
    return { success: false, error: new Error(teamError.message) };
  }

  return { success: true, error: null };
}
