import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  TournamentType,
  TournamentBracket,
  TournamentMatch,
  OpponentTeam,
} from "@/types/opponent";
import type { MatchResult } from "@/types/match";

/** トーナメント進行状態 */
export type TournamentStatus = "selecting" | "in_progress" | "completed" | "failed";

/** 試合結果記録 */
export interface MatchRecord {
  matchId: string;
  round: number;
  opponentName: string;
  result: "win" | "lose";
  score: string;
  matchResult: MatchResult;
  playedAt: string;
}

/** トーナメント履歴 */
export interface TournamentHistory {
  id: string;
  type: TournamentType;
  status: "completed" | "failed";
  wins: number;
  losses: number;
  isChampion: boolean;
  rewardEarned: number;
  completedAt: string;
}

interface TournamentState {
  // 現在のトーナメント
  currentBracket: TournamentBracket | null;
  status: TournamentStatus;
  teamId: string | null;

  // 試合記録
  matchRecords: MatchRecord[];

  // 過去のトーナメント履歴
  tournamentHistory: TournamentHistory[];

  // 解放済み大会
  unlockedTournaments: TournamentType[];

  // アクション
  startTournament: (bracket: TournamentBracket, teamId: string) => void;
  recordMatchResult: (
    matchId: string,
    playerWon: boolean,
    matchResult: MatchResult
  ) => void;
  completeTournament: (isChampion: boolean, rewardEarned: number) => void;
  clearCurrentTournament: () => void;
  unlockTournament: (type: TournamentType) => void;
  hasChampionship: (type: TournamentType) => boolean;
}

/**
 * トーナメント状態を管理するZustandストア
 * persistミドルウェアでlocalStorageに保存
 */
export const useTournamentStore = create<TournamentState>()(
  persist(
    (set, get) => ({
      currentBracket: null,
      status: "selecting",
      teamId: null,
      matchRecords: [],
      tournamentHistory: [],
      unlockedTournaments: ["district"],

      startTournament: (bracket, teamId) =>
        set({
          currentBracket: bracket,
          status: "in_progress",
          teamId,
          matchRecords: [],
        }),

      recordMatchResult: (matchId, playerWon, matchResult) => {
        const state = get();
        if (!state.currentBracket) return;

        // ブラケットを更新
        const updatedBracket = updateBracketWithResult(
          state.currentBracket,
          matchId,
          playerWon,
          matchResult
        );

        // 試合記録を追加
        const match = findMatchById(state.currentBracket, matchId);
        if (!match) return;

        const opponent = getOpponentFromMatch(match);
        const newRecord: MatchRecord = {
          matchId,
          round: match.round,
          opponentName: opponent?.name ?? "不明",
          result: playerWon ? "win" : "lose",
          score: `${matchResult.teamAScore}-${matchResult.teamBScore}`,
          matchResult,
          playedAt: new Date().toISOString(),
        };

        // 敗北した場合はトーナメント終了
        const newStatus = playerWon ? "in_progress" : "failed";

        set({
          currentBracket: updatedBracket,
          matchRecords: [...state.matchRecords, newRecord],
          status: newStatus,
        });
      },

      completeTournament: (isChampion, rewardEarned) => {
        const state = get();
        if (!state.currentBracket) return;

        const wins = state.matchRecords.filter((r) => r.result === "win").length;
        const losses = state.matchRecords.filter((r) => r.result === "lose").length;

        const history: TournamentHistory = {
          id: state.currentBracket.id,
          type: state.currentBracket.type,
          status: isChampion ? "completed" : "failed",
          wins,
          losses,
          isChampion,
          rewardEarned,
          completedAt: new Date().toISOString(),
        };

        set({
          status: "completed",
          tournamentHistory: [...state.tournamentHistory, history],
        });
      },

      clearCurrentTournament: () =>
        set({
          currentBracket: null,
          status: "selecting",
          teamId: null,
          matchRecords: [],
        }),

      unlockTournament: (type) => {
        const state = get();
        if (!state.unlockedTournaments.includes(type)) {
          set({
            unlockedTournaments: [...state.unlockedTournaments, type],
          });
        }
      },

      hasChampionship: (type) => {
        const state = get();
        return state.tournamentHistory.some(
          (h) => h.type === type && h.isChampion
        );
      },
    }),
    {
      name: "tournament-storage",
      storage: createJSONStorage(() => {
        // SSR時はダミーストレージを返す
        if (typeof window === "undefined") {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return localStorage;
      }),
      partialize: (state) => ({
        tournamentHistory: state.tournamentHistory,
        unlockedTournaments: state.unlockedTournaments,
      }),
      skipHydration: true,
    }
  )
);

/**
 * ブラケットを試合結果で更新
 */
function updateBracketWithResult(
  bracket: TournamentBracket,
  matchId: string,
  playerWon: boolean,
  matchResult: MatchResult
): TournamentBracket {
  const updatedRounds = bracket.rounds.map((round) =>
    round.map((match) => {
      if (match.id !== matchId) return match;

      const opponent = getOpponentFromMatch(match);
      return {
        ...match,
        winner: playerWon ? ("player" as const) : opponent,
        score: `${matchResult.teamAScore}-${matchResult.teamBScore}`,
      };
    })
  );

  // 次のラウンドに勝者を設定
  for (let roundIndex = 0; roundIndex < updatedRounds.length - 1; roundIndex++) {
    const currentRound = updatedRounds[roundIndex];

    for (let matchIndex = 0; matchIndex < currentRound.length; matchIndex++) {
      const match = currentRound[matchIndex];
      if (match.id !== matchId || !match.winner) continue;

      const nextRoundIndex = roundIndex + 1;
      const nextMatchIndex = Math.floor(matchIndex / 2);
      const nextMatch = updatedRounds[nextRoundIndex]?.[nextMatchIndex];

      if (nextMatch) {
        const isFirstTeam = matchIndex % 2 === 0;
        const winnerTeam = match.winner === "player" ? null : match.winner;

        if (isFirstTeam) {
          updatedRounds[nextRoundIndex][nextMatchIndex] = {
            ...nextMatch,
            team1: winnerTeam,
            hasPlayerTeam: nextMatch.hasPlayerTeam || match.winner === "player",
          };
        } else {
          updatedRounds[nextRoundIndex][nextMatchIndex] = {
            ...nextMatch,
            team2: winnerTeam,
            hasPlayerTeam: nextMatch.hasPlayerTeam || match.winner === "player",
          };
        }
      }
    }
  }

  // 現在のラウンドを更新
  let newCurrentRound = bracket.currentRound;
  if (playerWon) {
    const currentRoundMatches = updatedRounds[bracket.currentRound - 1];
    const allMatchesComplete = currentRoundMatches.every((m) => m.winner !== null);
    if (allMatchesComplete && bracket.currentRound < updatedRounds.length) {
      newCurrentRound = bracket.currentRound + 1;
    }
  }

  return {
    ...bracket,
    rounds: updatedRounds,
    currentRound: newCurrentRound,
  };
}

/**
 * 試合IDから試合を検索
 */
function findMatchById(
  bracket: TournamentBracket,
  matchId: string
): TournamentMatch | null {
  for (const round of bracket.rounds) {
    for (const match of round) {
      if (match.id === matchId) return match;
    }
  }
  return null;
}

/**
 * 試合から対戦相手を取得
 */
function getOpponentFromMatch(match: TournamentMatch): OpponentTeam | null {
  if (match.team1 === null) return match.team2;
  return match.team1;
}
