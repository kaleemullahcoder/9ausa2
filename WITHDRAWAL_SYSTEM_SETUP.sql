-- ============================================
-- WITHDRAWAL SYSTEM SETUP FOR QUANTUM AUSTRADE
-- ============================================
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- STEP 1: ADD ACCOUNT STATUS TO USERS TABLE
-- ============================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'frozen', 'blocked'));

-- ============================================
-- STEP 2: CREATE WITHDRAWAL REQUESTS TABLE
-- ============================================
DROP TABLE IF EXISTS withdrawal_requests CASCADE;

CREATE TABLE withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  network TEXT NOT NULL CHECK (network IN ('ERC20', 'TRC20', 'BTC')),
  wallet_address TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_reason TEXT,
  processed_by UUID REFERENCES users(id),
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- STEP 3: CREATE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_created_at ON withdrawal_requests(created_at DESC);

-- ============================================
-- STEP 4: ENABLE RLS
-- ============================================
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 5: CREATE RLS POLICIES
-- ============================================

-- Users can view their own withdrawal requests
DROP POLICY IF EXISTS "Users can view own withdrawal requests" ON withdrawal_requests;
CREATE POLICY "Users can view own withdrawal requests"
  ON withdrawal_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create withdrawal requests
DROP POLICY IF EXISTS "Users can create withdrawal requests" ON withdrawal_requests;
CREATE POLICY "Users can create withdrawal requests"
  ON withdrawal_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all withdrawal requests
DROP POLICY IF EXISTS "Admins can view all withdrawal requests" ON withdrawal_requests;
CREATE POLICY "Admins can view all withdrawal requests"
  ON withdrawal_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update withdrawal requests
DROP POLICY IF EXISTS "Admins can update withdrawal requests" ON withdrawal_requests;
CREATE POLICY "Admins can update withdrawal requests"
  ON withdrawal_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- STEP 6: CREATE TRADE SETTINGS TABLE
-- ============================================
DROP TABLE IF EXISTS trade_settings CASCADE;

CREATE TABLE trade_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  duration_seconds INTEGER NOT NULL UNIQUE,
  profit_percentage INTEGER NOT NULL CHECK (profit_percentage >= 0 AND profit_percentage <= 100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default trade settings
INSERT INTO trade_settings (duration_seconds, profit_percentage, is_active) VALUES
  (60, 30, true),
  (120, 50, true),
  (180, 60, true),
  (240, 70, true),
  (300, 80, true)
ON CONFLICT (duration_seconds) DO UPDATE SET
  profit_percentage = EXCLUDED.profit_percentage,
  is_active = EXCLUDED.is_active;

-- Enable RLS on trade_settings
ALTER TABLE trade_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read trade settings
DROP POLICY IF EXISTS "Anyone can view trade settings" ON trade_settings;
CREATE POLICY "Anyone can view trade settings"
  ON trade_settings FOR SELECT
  USING (true);

-- Only admins can update trade settings
DROP POLICY IF EXISTS "Admins can update trade settings" ON trade_settings;
CREATE POLICY "Admins can update trade settings"
  ON trade_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- STEP 7: ADD CREDIT SCORE TO USERS
-- ============================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS credit_score INTEGER DEFAULT 100;

-- ============================================
-- VERIFICATION
-- ============================================
SELECT 'withdrawal_requests table created' AS status;
SELECT 'trade_settings table created' AS status;
SELECT * FROM trade_settings ORDER BY duration_seconds;