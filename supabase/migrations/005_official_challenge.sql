-- チャレンジに公式フラグを追加
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS is_official BOOLEAN DEFAULT false;

-- 非公開理由
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS suspended_reason TEXT;
