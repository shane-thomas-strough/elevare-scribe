-- ============================================================================
-- UPDATE CREDITS TO 5 PER MONTH
-- ============================================================================

-- Update the handle_new_user function to give 5 credits
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, tier, auth_user_id, credits_remaining, credits_used)
  VALUES (
    NEW.id,
    NEW.email,
    'free',
    NEW.id,
    5,  -- 5 free credits per month
    0
  )
  ON CONFLICT (email) DO UPDATE SET
    auth_user_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the monthly credits reset function
CREATE OR REPLACE FUNCTION reset_monthly_credits()
RETURNS void AS $$
BEGIN
  UPDATE users
  SET
    credits_remaining = CASE
      WHEN tier = 'free' THEN 5  -- 5 free credits per month
      WHEN tier IN ('pro', 'founding', 'enterprise') THEN 999999
      ELSE 5
    END,
    credits_used = 0,
    credits_reset_at = now()
  WHERE credits_reset_at < now() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Update existing free tier users who have fewer than 5 credits to 5
-- (Only if they haven't used any yet this period)
UPDATE users
SET credits_remaining = 5
WHERE tier = 'free'
  AND credits_used = 0
  AND credits_remaining < 5;

-- ============================================================================
-- DONE
-- ============================================================================
