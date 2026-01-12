import { create } from 'zustand';

interface Tournament {
  id: string;
  team_id: string;
  tournament_type: 'district' | 'regional' | 'national';
  status: 'in_progress' | 'completed' | 'failed';
  current_round: number;
  created_at: string;
}

interface Match {
  id: string;
  tournament_id: string;
  opponent_name: string;
  result: 'win' | 'lose';
  score: string;
  date: string;
}

interface TournamentState {
  currentTournament: Tournament | null;
  matches: Match[];
  setCurrentTournament: (tournament: Tournament | null) => void;
  setMatches: (matches: Match[]) => void;
  addMatch: (match: Match) => void;
}

/**
 * トーナメント状態を管理するZustandストア
 */
export const useTournamentStore = create<TournamentState>((set) => ({
  currentTournament: null,
  matches: [],
  setCurrentTournament: (tournament) => set({ currentTournament: tournament }),
  setMatches: (matches) => set({ matches }),
  addMatch: (match) =>
    set((state) => ({ matches: [...state.matches, match] })),
}));
