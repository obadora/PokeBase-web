-- team_membersテーブルに学年カラムを追加
-- 1: 1年生, 2: 2年生, 3: 3年生

ALTER TABLE public.team_members
ADD COLUMN IF NOT EXISTS grade INTEGER NOT NULL DEFAULT 1
CHECK (grade >= 1 AND grade <= 3);

-- 学年でのインデックス
CREATE INDEX IF NOT EXISTS idx_team_members_grade ON public.team_members(grade);

-- コメント
COMMENT ON COLUMN public.team_members.grade IS '学年 (1: 1年生, 2: 2年生, 3: 3年生)';
