/**
 * トーナメント表コンポーネント
 * トーナメントブラケットを視覚的に表示
 */

"use client";

import type { TournamentBracket, TournamentMatch, OpponentTeam } from "@/types/opponent";

interface TournamentBracketProps {
  bracket: TournamentBracket;
  playerTeamName: string;
  onMatchClick?: (match: TournamentMatch) => void;
}

interface MatchCardProps {
  match: TournamentMatch;
  playerTeamName: string;
  isClickable: boolean;
  onClick?: () => void;
}

function MatchCard({ match, playerTeamName, isClickable, onClick }: MatchCardProps) {
  const getTeamDisplay = (team: OpponentTeam | null, isPlayer: boolean) => {
    if (isPlayer) {
      return {
        name: playerTeamName,
        isWinner: match.winner === "player",
        isLoser: match.winner !== null && match.winner !== "player",
      };
    }

    if (team === null) {
      return {
        name: "未定",
        isWinner: false,
        isLoser: false,
      };
    }

    return {
      name: team.name,
      isWinner: match.winner === team,
      isLoser: match.winner !== null && match.winner !== team && match.winner !== "player",
    };
  };

  const team1Display = getTeamDisplay(match.team1, match.team1 === null && match.hasPlayerTeam);
  const team2Display = getTeamDisplay(match.team2, match.team2 === null && match.hasPlayerTeam);

  const isPlayerMatch = match.hasPlayerTeam;
  const hasResult = match.winner !== null;

  return (
    <div
      className={`bg-white rounded-lg shadow-md overflow-hidden transition-all ${
        isClickable && isPlayerMatch && !hasResult
          ? "cursor-pointer hover:shadow-lg hover:ring-2 hover:ring-green-500"
          : ""
      } ${isPlayerMatch ? "border-2 border-green-400" : "border border-gray-200"}`}
      onClick={isClickable && isPlayerMatch && !hasResult ? onClick : undefined}
    >
      {/* チーム1 */}
      <div
        className={`flex items-center justify-between px-3 py-2 border-b ${
          team1Display.isWinner
            ? "bg-green-100"
            : team1Display.isLoser
              ? "bg-gray-100 text-gray-400"
              : ""
        }`}
      >
        <span
          className={`text-sm font-medium truncate ${
            match.team1 === null && match.hasPlayerTeam ? "text-green-600 font-bold" : ""
          }`}
        >
          {team1Display.name}
        </span>
        {team1Display.isWinner && (
          <span className="text-green-600 text-xs font-bold">WIN</span>
        )}
      </div>

      {/* チーム2 */}
      <div
        className={`flex items-center justify-between px-3 py-2 ${
          team2Display.isWinner
            ? "bg-green-100"
            : team2Display.isLoser
              ? "bg-gray-100 text-gray-400"
              : ""
        }`}
      >
        <span
          className={`text-sm font-medium truncate ${
            match.team2 === null && match.hasPlayerTeam ? "text-green-600 font-bold" : ""
          }`}
        >
          {team2Display.name}
        </span>
        {team2Display.isWinner && (
          <span className="text-green-600 text-xs font-bold">WIN</span>
        )}
      </div>

      {/* スコア */}
      {match.score && (
        <div className="bg-gray-50 px-3 py-1 text-center">
          <span className="text-xs text-gray-600">{match.score}</span>
        </div>
      )}
    </div>
  );
}

export function TournamentBracketDisplay({
  bracket,
  playerTeamName,
  onMatchClick,
}: TournamentBracketProps) {
  const roundNames = ["1回戦", "2回戦", "準決勝", "決勝"];

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-8 min-w-max p-4">
        {bracket.rounds.map((round, roundIndex) => (
          <div key={roundIndex} className="flex flex-col">
            {/* ラウンド名 */}
            <h3 className="text-center font-bold text-gray-700 mb-4">
              {roundNames[roundIndex] || `ラウンド${roundIndex + 1}`}
            </h3>

            {/* 対戦カード */}
            <div
              className="flex flex-col justify-around flex-1 gap-4"
              style={{
                minHeight: `${round.length * 120}px`,
              }}
            >
              {round.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  playerTeamName={playerTeamName}
                  isClickable={roundIndex === bracket.currentRound - 1}
                  onClick={() => onMatchClick?.(match)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
