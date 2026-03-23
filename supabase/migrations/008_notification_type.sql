-- notifications テーブルに type カラムを追加（運営お知らせ vs 通常通知を区別）
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'normal';

-- type カラムにインデックス（フィルタ用）
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications (type);

COMMENT ON COLUMN notifications.type IS 'normal=通常通知, announcement=運営からのお知らせ';
