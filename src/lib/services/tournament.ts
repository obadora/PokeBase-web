/**
 * トーナメント表生成サービス
 * - トーナメントブラケット生成
 * - 対戦カード作成
 */

import type { Pokemon } from "@/types/index";
import type {
  TournamentType,
  TournamentBracket,
  TournamentMatch,
  OpponentTeam,
} from "@/types/opponent";
import { TOURNAMENT_CONFIGS } from "@/types/opponent";
import { generateOpponentTeams } from "@/lib/services/opponent";

/**
 * ユニークIDを生成
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * トーナメントの必要ラウンド数を計算
 * @param teamCount チーム数
 * @returns ラウンド数
 */
export function calculateRoundCount(teamCount: number): number {
  return Math.ceil(Math.log2(teamCount));
}

/**
 * トーナメントブラケットを生成
 * @param allPokemon 全ポケモンリスト
 * @param tournamentType 大会種別
 * @returns トーナメントブラケット
 */
export function generateTournamentBracket(
  allPokemon: Pokemon[],
  tournamentType: TournamentType
): TournamentBracket {
  const config = TOURNAMENT_CONFIGS[tournamentType];
  const { teamCount } = config;

  // 対戦相手チームを生成
  const opponentTeams = generateOpponentTeams(allPokemon, tournamentType);

  // プレイヤーチームのシード（ランダム）
  const playerSeed = Math.floor(Math.random() * teamCount) + 1;

  // 全チーム（プレイヤー位置にはnullを入れる）
  const teams: (OpponentTeam | null)[] = [];
  let opponentIndex = 0;

  for (let i = 1; i <= teamCount; i++) {
    if (i === playerSeed) {
      teams.push(null); // プレイヤーチームの位置
    } else {
      teams.push(opponentTeams[opponentIndex]);
      opponentIndex++;
    }
  }

  // ラウンド数を計算
  const roundCount = calculateRoundCount(teamCount);

  // 各ラウンドの対戦カードを生成
  const rounds: TournamentMatch[][] = [];

  // 1回戦を生成
  const firstRound: TournamentMatch[] = [];
  for (let i = 0; i < teamCount; i += 2) {
    const team1 = teams[i];
    const team2 = teams[i + 1];

    const match: TournamentMatch = {
      id: generateId(),
      round: 1,
      matchNumber: Math.floor(i / 2) + 1,
      team1,
      team2,
      hasPlayerTeam: team1 === null || team2 === null,
      winner: null,
      score: null,
    };

    firstRound.push(match);
  }
  rounds.push(firstRound);

  // 2回戦以降を生成（まだ対戦相手は未定）
  let matchesInPreviousRound = firstRound.length;

  for (let round = 2; round <= roundCount; round++) {
    const currentRound: TournamentMatch[] = [];
    const matchesInCurrentRound = matchesInPreviousRound / 2;

    for (let i = 0; i < matchesInCurrentRound; i++) {
      const match: TournamentMatch = {
        id: generateId(),
        round,
        matchNumber: i + 1,
        team1: null, // 勝者が決まるまで未定
        team2: null,
        hasPlayerTeam: false, // 1回戦の結果次第
        winner: null,
        score: null,
      };

      currentRound.push(match);
    }

    rounds.push(currentRound);
    matchesInPreviousRound = matchesInCurrentRound;
  }

  return {
    id: generateId(),
    type: tournamentType,
    rounds,
    teams: opponentTeams,
    currentRound: 1,
    playerSeed,
  };
}

/**
 * プレイヤーの次の対戦を取得
 * @param bracket トーナメントブラケット
 * @returns 次の対戦カード（なければnull）
 */
export function getNextPlayerMatch(bracket: TournamentBracket): TournamentMatch | null {
  const currentRound = bracket.rounds[bracket.currentRound - 1];

  if (!currentRound) {
    return null;
  }

  // プレイヤーが参加している対戦を探す
  const playerMatch = currentRound.find((match) => match.hasPlayerTeam);

  return playerMatch ?? null;
}

/**
 * プレイヤーの対戦相手を取得
 * @param match 対戦カード
 * @returns 対戦相手チーム（なければnull）
 */
export function getPlayerOpponent(match: TournamentMatch): OpponentTeam | null {
  if (match.team1 === null) {
    return match.team2;
  }
  return match.team1;
}

/**
 * 試合結果を記録
 * @param bracket トーナメントブラケット
 * @param matchId 対戦ID
 * @param playerWon プレイヤーが勝利したか
 * @param score スコア
 * @returns 更新されたトーナメントブラケット
 */
export function recordMatchResult(
  bracket: TournamentBracket,
  matchId: string,
  playerWon: boolean,
  score: string
): TournamentBracket {
  const updatedBracket = { ...bracket };
  updatedBracket.rounds = bracket.rounds.map((round) => [...round]);

  // 対戦を探して結果を記録
  for (let roundIndex = 0; roundIndex < updatedBracket.rounds.length; roundIndex++) {
    const round = updatedBracket.rounds[roundIndex];

    for (let matchIndex = 0; matchIndex < round.length; matchIndex++) {
      const match = round[matchIndex];

      if (match.id === matchId) {
        // 結果を記録
        const updatedMatch: TournamentMatch = {
          ...match,
          winner: playerWon ? "player" : getPlayerOpponent(match),
          score,
        };

        updatedBracket.rounds[roundIndex] = [...round];
        updatedBracket.rounds[roundIndex][matchIndex] = updatedMatch;

        // 次のラウンドに勝者を設定
        if (roundIndex + 1 < updatedBracket.rounds.length) {
          const nextRound = updatedBracket.rounds[roundIndex + 1];
          const nextMatchIndex = Math.floor(matchIndex / 2);
          const nextMatch = nextRound[nextMatchIndex];

          if (nextMatch) {
            const isFirstTeam = matchIndex % 2 === 0;
            const updatedNextMatch: TournamentMatch = {
              ...nextMatch,
              [isFirstTeam ? "team1" : "team2"]: playerWon ? null : getPlayerOpponent(match),
              hasPlayerTeam: nextMatch.hasPlayerTeam || playerWon,
            };

            updatedBracket.rounds[roundIndex + 1] = [...nextRound];
            updatedBracket.rounds[roundIndex + 1][nextMatchIndex] = updatedNextMatch;
          }
        }

        // プレイヤーが勝った場合、次のラウンドへ
        if (playerWon && roundIndex + 1 < updatedBracket.rounds.length) {
          updatedBracket.currentRound = roundIndex + 2;
        }

        return updatedBracket;
      }
    }
  }

  return updatedBracket;
}

/**
 * トーナメントが完了しているか確認
 * @param bracket トーナメントブラケット
 * @returns 完了している場合true
 */
export function isTournamentComplete(bracket: TournamentBracket): boolean {
  const finalRound = bracket.rounds[bracket.rounds.length - 1];
  if (!finalRound || finalRound.length !== 1) {
    return false;
  }

  return finalRound[0].winner !== null;
}

/**
 * プレイヤーが優勝したか確認
 * @param bracket トーナメントブラケット
 * @returns 優勝した場合true
 */
export function didPlayerWin(bracket: TournamentBracket): boolean {
  const finalRound = bracket.rounds[bracket.rounds.length - 1];
  if (!finalRound || finalRound.length !== 1) {
    return false;
  }

  return finalRound[0].winner === "player";
}

/**
 * プレイヤーが敗退したか確認
 * @param bracket トーナメントブラケット
 * @returns 敗退した場合true
 */
export function didPlayerLose(bracket: TournamentBracket): boolean {
  // 各ラウンドでプレイヤーの対戦結果を確認
  for (const round of bracket.rounds) {
    for (const match of round) {
      if (match.hasPlayerTeam && match.winner !== null && match.winner !== "player") {
        return true;
      }
    }
  }

  return false;
}

/**
 * トーナメント状態のサマリーを取得
 * @param bracket トーナメントブラケット
 * @returns サマリー情報
 */
export function getTournamentSummary(bracket: TournamentBracket): {
  totalRounds: number;
  currentRound: number;
  playerWins: number;
  playerLosses: number;
  isComplete: boolean;
  isPlayerWinner: boolean;
} {
  let playerWins = 0;
  let playerLosses = 0;

  for (const round of bracket.rounds) {
    for (const match of round) {
      if (match.hasPlayerTeam && match.winner !== null) {
        if (match.winner === "player") {
          playerWins++;
        } else {
          playerLosses++;
        }
      }
    }
  }

  return {
    totalRounds: bracket.rounds.length,
    currentRound: bracket.currentRound,
    playerWins,
    playerLosses,
    isComplete: isTournamentComplete(bracket),
    isPlayerWinner: didPlayerWin(bracket),
  };
}
