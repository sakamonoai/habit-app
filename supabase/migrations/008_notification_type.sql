-- notifications テーブルを作成（存在しない場合）
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  url TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  type TEXT NOT NULL DEFAULT 'normal',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS 有効化
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の通知のみ参照可能
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own notifications' AND tablename = 'notifications') THEN
    CREATE POLICY "Users can read own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- ユーザーは自分の通知を更新可能（既読化）
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own notifications' AND tablename = 'notifications') THEN
    CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- サービスロール（API）から挿入可能
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role can insert notifications' AND tablename = 'notifications') THEN
    CREATE POLICY "Service role can insert notifications" ON notifications FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- インデックス
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications (user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications (user_id, type, created_at DESC);

COMMENT ON COLUMN notifications.type IS 'normal=通常通知, announcement=運営からのお知らせ';
