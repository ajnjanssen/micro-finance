create table public.accounts (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  name text not null,
  type text not null check (type in ('checking', 'savings', 'crypto', 'stocks', 'debt', 'other')),
  starting_balance numeric(14, 2) not null default 0,
  start_date date not null,
  description text,
  expected_annual_return numeric(7, 4),
  primary key (user_id, id)
);

create table public.categories (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  name text not null,
  type text not null check (type in ('income', 'expense', 'transfer')),
  color text not null,
  primary key (user_id, id)
);

create table public.transactions (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  description text not null,
  amount numeric(14, 2) not null,
  type text not null check (type in ('income', 'expense', 'transfer')),
  category text not null,
  category_reason text,
  account_id text not null,
  transaction_date date not null,
  is_recurring boolean not null default false,
  recurring_type text,
  recurring_end_date date,
  tags text[],
  completed boolean,
  completed_date date,
  to_account_id text,
  from_account_id text,
  transfer_id text,
  savings_goal_id text,
  primary key (user_id, id),
  foreign key (user_id, account_id) references public.accounts (user_id, id) on delete restrict,
  foreign key (user_id, to_account_id) references public.accounts (user_id, id) on delete restrict,
  foreign key (user_id, from_account_id) references public.accounts (user_id, id) on delete restrict
);
create index transactions_user_date_idx on public.transactions (user_id, transaction_date desc);
create index transactions_user_account_idx on public.transactions (user_id, account_id);

create table public.income_sources (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  name text not null,
  amount numeric(14, 2) not null,
  frequency text not null,
  day_of_month smallint,
  start_date date not null,
  end_date date,
  is_active boolean not null default true,
  notes text,
  account_id text,
  category text not null,
  primary key (user_id, id),
  foreign key (user_id, account_id) references public.accounts (user_id, id) on delete restrict
);

create table public.recurring_expenses (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  name text not null,
  category text not null,
  amount numeric(14, 2) not null,
  frequency text not null,
  day_of_month smallint,
  start_date date not null,
  end_date date,
  is_active boolean not null default true,
  is_essential boolean not null default false,
  is_variable boolean not null default false,
  estimated_variance numeric(7, 4),
  budget_type text check (budget_type in ('needs', 'wants', 'savings')),
  account_id text,
  notes text,
  primary key (user_id, id),
  foreign key (user_id, account_id) references public.accounts (user_id, id) on delete restrict
);

create table public.one_time_expenses (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  name text not null,
  category text not null,
  amount numeric(14, 2) not null,
  expense_date date not null,
  is_paid boolean not null default false,
  notes text,
  primary key (user_id, id)
);

create table public.savings_goals (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  name text not null,
  description text,
  target_amount numeric(14, 2) not null,
  current_amount numeric(14, 2) not null default 0,
  category_id text,
  deadline date,
  priority text not null check (priority in ('low', 'medium', 'high')),
  budget_type text check (budget_type in ('needs', 'wants', 'savings')),
  image_url text,
  image_urls text[],
  source_url text,
  monthly_contribution numeric(14, 2),
  tags text[],
  from_account_id text,
  to_account_id text,
  start_date date,
  end_date date,
  completed_date date,
  spent_date date,
  spent_transaction_id text,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  primary key (user_id, id),
  foreign key (user_id, from_account_id) references public.accounts (user_id, id) on delete restrict,
  foreign key (user_id, to_account_id) references public.accounts (user_id, id) on delete restrict
);

create table public.config_savings_goals (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  name text not null,
  target_amount numeric(14, 2) not null,
  current_amount numeric(14, 2) not null default 0,
  deadline date,
  monthly_contribution numeric(14, 2),
  priority text not null check (priority in ('low', 'medium', 'high')),
  is_active boolean not null default true,
  primary key (user_id, id)
);

create table public.financial_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  version text not null default '3.0',
  starting_balance jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{"defaultCurrency":"EUR","projectionMonths":36,"conservativeMode":false}'::jsonb,
  budget_category_mappings jsonb not null default '{}'::jsonb,
  last_updated timestamptz not null default now()
);

create table public.assets (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  name text not null,
  type text not null,
  description text,
  current_value numeric(14, 2) not null,
  purchase_price numeric(14, 2),
  purchase_date date,
  appreciation_rate numeric(7, 4),
  depreciation_rate numeric(7, 4),
  is_active boolean not null default true,
  last_updated timestamptz not null,
  location text,
  notes text,
  primary key (user_id, id)
);

create table public.liabilities (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  name text not null,
  type text not null,
  description text,
  original_amount numeric(14, 2) not null,
  current_balance numeric(14, 2) not null,
  interest_rate numeric(7, 4) not null,
  monthly_payment numeric(14, 2),
  payment_frequency text,
  minimum_payment numeric(14, 2),
  start_date date not null,
  end_date date,
  is_active boolean not null default true,
  last_updated timestamptz not null,
  creditor text,
  account_number text,
  notes text,
  primary key (user_id, id)
);

create table public.app_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  theme text not null default 'sunset',
  typography jsonb not null default '{}'::jsonb,
  version text not null default '1.0.0'
);

create table public.activity_logs (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  logged_at timestamptz not null,
  action text not null,
  entity text not null,
  entity_id text,
  entity_name text,
  details text,
  metadata jsonb,
  primary key (user_id, id)
);
create index activity_logs_user_date_idx on public.activity_logs (user_id, logged_at desc);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'accounts',
    'categories',
    'transactions',
    'income_sources',
    'recurring_expenses',
    'one_time_expenses',
    'savings_goals',
    'config_savings_goals',
    'financial_profiles',
    'assets',
    'liabilities',
    'app_settings',
    'activity_logs'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on public.%I from anon', table_name);
    execute format(
      'grant select, insert, update, delete on public.%I to authenticated',
      table_name
    );
    execute format(
      'create policy %I on public.%I for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))',
      table_name || '_user_isolation',
      table_name
    );
  end loop;
end
$$;

insert into storage.buckets (id, name, public)
values ('financial-imports', 'financial-imports', false)
on conflict (id) do nothing;

create policy "users_manage_own_financial_imports"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'financial-imports'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'financial-imports'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
