-- Phase 2 初期データベーススキーマ

-- usersテーブル (Supabase Authと連携)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- teamsテーブル
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  team_name TEXT NOT NULL,
  reputation INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- team_membersテーブル
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  pokemon_id INTEGER NOT NULL,
  position TEXT NOT NULL,
  is_starter BOOLEAN NOT NULL DEFAULT false,
  join_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- tournamentsテーブル
CREATE TABLE IF NOT EXISTS public.tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  tournament_type TEXT NOT NULL CHECK (tournament_type IN ('district', 'regional', 'national')),
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed')),
  current_round INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- matchesテーブル
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  opponent_name TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('win', 'lose')),
  score TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_teams_user_id ON public.teams(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_team_id ON public.tournaments(team_id);
CREATE INDEX IF NOT EXISTS idx_matches_tournament_id ON public.matches(tournament_id);

-- Row Level Security (RLS) ポリシー

-- usersテーブル: ユーザーは自分のデータのみ閲覧・更新可能
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own data"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- teamsテーブル: ユーザーは自分のチームのみ操作可能
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own teams"
  ON public.teams FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own teams"
  ON public.teams FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own teams"
  ON public.teams FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own teams"
  ON public.teams FOR DELETE
  USING (auth.uid() = user_id);

-- team_membersテーブル: チームのオーナーのみ操作可能
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own team members"
  ON public.team_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.id = team_members.team_id
      AND teams.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own team members"
  ON public.team_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.id = team_members.team_id
      AND teams.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own team members"
  ON public.team_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.id = team_members.team_id
      AND teams.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own team members"
  ON public.team_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.id = team_members.team_id
      AND teams.user_id = auth.uid()
    )
  );

-- tournamentsテーブル: チームのオーナーのみ操作可能
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tournaments"
  ON public.tournaments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.id = tournaments.team_id
      AND teams.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own tournaments"
  ON public.tournaments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.id = tournaments.team_id
      AND teams.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own tournaments"
  ON public.tournaments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.id = tournaments.team_id
      AND teams.user_id = auth.uid()
    )
  );

-- matchesテーブル: トーナメントのオーナーのみ操作可能
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own matches"
  ON public.matches FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tournaments
      JOIN public.teams ON teams.id = tournaments.team_id
      WHERE tournaments.id = matches.tournament_id
      AND teams.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own matches"
  ON public.matches FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tournaments
      JOIN public.teams ON teams.id = tournaments.team_id
      WHERE tournaments.id = matches.tournament_id
      AND teams.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own matches"
  ON public.matches FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.tournaments
      JOIN public.teams ON teams.id = tournaments.team_id
      WHERE tournaments.id = matches.tournament_id
      AND teams.user_id = auth.uid()
    )
  );

-- 更新日時を自動更新するトリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
