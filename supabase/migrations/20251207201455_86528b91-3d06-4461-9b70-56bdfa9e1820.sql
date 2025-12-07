-- Remove duplicate subscriptions keeping only the most recent one per user
DELETE FROM subscriptions 
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id 
  FROM subscriptions 
  ORDER BY user_id, created_at DESC
);

-- Add unique constraint on user_id to allow upsert to work correctly
ALTER TABLE subscriptions 
ADD CONSTRAINT subscriptions_user_id_unique UNIQUE (user_id);