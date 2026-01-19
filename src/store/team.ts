import { create } from "zustand";
import type { Team, TeamMember } from "@/types/team";

interface TeamState {
  currentTeam: Team | null;
  members: TeamMember[];
  isLoading: boolean;
  error: string | null;
  setCurrentTeam: (team: Team | null) => void;
  setMembers: (members: TeamMember[]) => void;
  addMember: (member: TeamMember) => void;
  updateMember: (id: string, updates: Partial<TeamMember>) => void;
  removeMember: (id: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearTeam: () => void;
}

/**
 * チーム状態を管理するZustandストア
 */
export const useTeamStore = create<TeamState>((set) => ({
  currentTeam: null,
  members: [],
  isLoading: false,
  error: null,
  setCurrentTeam: (team) => set({ currentTeam: team }),
  setMembers: (members) => set({ members }),
  addMember: (member) => set((state) => ({ members: [...state.members, member] })),
  updateMember: (id, updates) =>
    set((state) => ({
      members: state.members.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    })),
  removeMember: (id) =>
    set((state) => ({
      members: state.members.filter((m) => m.id !== id),
    })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearTeam: () => set({ currentTeam: null, members: [], error: null }),
}));
