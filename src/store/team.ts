import { create } from 'zustand';

interface Team {
  id: string;
  user_id: string;
  team_name: string;
  reputation: number;
  created_at: string;
  updated_at: string;
}

interface TeamMember {
  id: string;
  team_id: string;
  pokemon_id: number;
  position: string;
  is_starter: boolean;
  join_date: string;
}

interface TeamState {
  currentTeam: Team | null;
  members: TeamMember[];
  setCurrentTeam: (team: Team | null) => void;
  setMembers: (members: TeamMember[]) => void;
  addMember: (member: TeamMember) => void;
  updateMember: (id: string, updates: Partial<TeamMember>) => void;
  removeMember: (id: string) => void;
}

/**
 * チーム状態を管理するZustandストア
 */
export const useTeamStore = create<TeamState>((set) => ({
  currentTeam: null,
  members: [],
  setCurrentTeam: (team) => set({ currentTeam: team }),
  setMembers: (members) => set({ members }),
  addMember: (member) =>
    set((state) => ({ members: [...state.members, member] })),
  updateMember: (id, updates) =>
    set((state) => ({
      members: state.members.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    })),
  removeMember: (id) =>
    set((state) => ({
      members: state.members.filter((m) => m.id !== id),
    })),
}));
