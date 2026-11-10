-- Giai đoạn 1. Chạy toàn bộ trong SQL Editor của một project Supabase mới.
-- Atomic: lỗi ở bất kỳ bước nào sẽ rollback toàn bộ thay đổi.
begin;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  color text not null default '#166534' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  emoji text not null default '📌' check (char_length(emoji) between 1 and 32),
  type text not null check (type in ('income', 'expense')),
  created_at timestamptz not null default now(),
  unique (user_id, type, name),
  -- Composite key binds both ownership and transaction type.
  unique (id, user_id, type)
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  amount numeric(15,0) not null check (amount > 0),
  category_id uuid not null,
  date date not null default (now() at time zone 'Asia/Ho_Chi_Minh')::date,
  note text not null default '' check (char_length(note) <= 2000),
  created_at timestamptz not null default now(),
  foreign key (category_id, user_id, type)
    references public.categories(id, user_id, type) on delete restrict
);

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  category_id uuid not null,
  type text not null default 'expense' check (type = 'expense'),
  month date not null check (extract(day from month) = 1),
  amount numeric(15,0) not null check (amount > 0),
  created_at timestamptz not null default now(),
  unique (user_id, category_id, month),
  foreign key (category_id, user_id, type)
    references public.categories(id, user_id, type) on delete restrict
);

-- Ownership indexes are also covered by the leading columns of unique indexes.
create index transactions_user_date_idx on public.transactions(user_id, date desc, id);
create index transactions_category_idx on public.transactions(category_id, user_id, type);
create index transactions_user_type_amount_idx on public.transactions(user_id, type, amount);
create index budgets_user_month_idx on public.budgets(user_id, month);
create index budgets_category_idx on public.budgets(category_id, user_id, type);

alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;

create policy categories_select on public.categories for select to authenticated
  using ((select auth.uid()) = user_id);
create policy categories_insert on public.categories for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy categories_update on public.categories for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy categories_delete on public.categories for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy transactions_select on public.transactions for select to authenticated
  using ((select auth.uid()) = user_id);
create policy transactions_insert on public.transactions for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy transactions_update on public.transactions for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy transactions_delete on public.transactions for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy budgets_select on public.budgets for select to authenticated
  using ((select auth.uid()) = user_id);
create policy budgets_insert on public.budgets for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy budgets_update on public.budgets for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy budgets_delete on public.budgets for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.categories, public.transactions, public.budgets from anon, authenticated;
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.categories, public.transactions, public.budgets to authenticated;

-- Auth inserts do not have the new user's JWT yet. Only this internal trigger
-- uses SECURITY DEFINER; it takes NEW.id exclusively from auth.users.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create function private.seed_user_categories()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.categories(user_id, name, color, emoji, type) values
    (new.id, 'Ăn uống', '#F97316', '🍜', 'expense'),
    (new.id, 'Đi lại', '#3B82F6', '🛵', 'expense'),
    (new.id, 'Nhà ở', '#8B5CF6', '🏠', 'expense'),
    (new.id, 'Mua sắm', '#EC4899', '🛍️', 'expense'),
    (new.id, 'Giải trí', '#EAB308', '🎬', 'expense'),
    (new.id, 'Sức khỏe', '#EF4444', '💊', 'expense'),
    (new.id, 'Học tập', '#06B6D4', '📚', 'expense'),
    (new.id, 'Lương', '#22C55E', '💼', 'income'),
    (new.id, 'Khác', '#64748B', '📌', 'expense'),
    (new.id, 'Khác', '#64748B', '📌', 'income');
  return new;
end;
$$;
revoke all on function private.seed_user_categories() from public, anon, authenticated;
create trigger on_auth_user_created_categories
  after insert on auth.users for each row execute function private.seed_user_categories();

commit;
