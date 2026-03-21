-- profilesにstripe_customer_idを追加
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- group_membersにStripe関連カラムを追加
ALTER TABLE group_members ADD COLUMN IF NOT EXISTS deposit_payment_intent_id TEXT;
ALTER TABLE group_members ADD COLUMN IF NOT EXISTS fee_payment_intent_id TEXT;

-- group_membersにstatusカラムを追加（既存のstatusがない場合）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'group_members' AND column_name = 'status'
  ) THEN
    ALTER TABLE group_members ADD COLUMN status TEXT DEFAULT 'active';
    ALTER TABLE group_members ADD CONSTRAINT group_members_status_check
      CHECK (status IN ('active', 'completed', 'forfeited'));
  END IF;
END $$;

-- stripe_customer_idにインデックスを追加（検索高速化）
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id
  ON profiles (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

-- deposit_payment_intent_idにインデックスを追加
CREATE INDEX IF NOT EXISTS idx_group_members_deposit_pi
  ON group_members (deposit_payment_intent_id)
  WHERE deposit_payment_intent_id IS NOT NULL;
