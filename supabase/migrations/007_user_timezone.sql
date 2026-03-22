-- ユーザーのタイムゾーンを保存（IANA形式: Asia/Tokyo, America/New_York等）
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Asia/Tokyo';
