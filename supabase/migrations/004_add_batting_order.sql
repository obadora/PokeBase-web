-- team_membersテーブルに打順カラムを追加
ALTER TABLE team_members
ADD COLUMN IF NOT EXISTS batting_order INTEGER DEFAULT NULL;

-- 打順は1-9の範囲でNULL許容（ベンチメンバーはNULL）
-- スタメンのみ打順を設定
COMMENT ON COLUMN team_members.batting_order IS '打順（1-9）、ベンチメンバーはNULL';
