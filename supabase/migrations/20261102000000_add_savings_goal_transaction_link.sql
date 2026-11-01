alter table public.transactions
  add column if not exists savings_goal_id text;
