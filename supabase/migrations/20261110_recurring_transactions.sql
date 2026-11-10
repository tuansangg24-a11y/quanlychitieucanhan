begin;
create table if not exists public.recurring_transactions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 type text not null check(type in ('income','expense')),
 amount numeric(15,0) not null check(amount>0),
 category_id uuid not null,
 note text not null default '' check(char_length(note)<=2000),
 frequency text not null check(frequency in ('weekly','monthly','yearly')),
 start_date date not null check(start_date >= date '1900-01-01' and start_date <= date '2099-12-31'),
 end_date date check(end_date is null or end_date>=start_date),
 enabled boolean not null default true,
 last_generated_on date,
 created_at timestamptz not null default now(),
 unique(id,user_id),
 foreign key(category_id,user_id,type) references public.categories(id,user_id,type) on delete restrict
);
alter table public.recurring_transactions enable row level security;
do $$ begin
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='recurring_transactions' and policyname='recurring_owner') then
  create policy recurring_owner on public.recurring_transactions for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
 end if;
end $$;
alter table public.transactions add column if not exists recurring_id uuid;
alter table public.transactions add column if not exists occurrence_date date;
do $$ begin
 if not exists(select 1 from pg_constraint where conname='transactions_recurring_owner_fk' and conrelid='public.transactions'::regclass) then
  alter table public.transactions add constraint transactions_recurring_owner_fk foreign key(recurring_id,user_id) references public.recurring_transactions(id,user_id) on delete set null (recurring_id);
 end if;
end $$;
create unique index if not exists transactions_recurring_occurrence_idx on public.transactions(recurring_id,occurrence_date) where recurring_id is not null;
-- Retain occurrence receipts when an individual generated transaction is deleted.
create table if not exists public.recurring_occurrences (
 recurring_id uuid not null,
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 occurrence_date date not null,
 primary key(recurring_id,occurrence_date),
 foreign key(recurring_id,user_id) references public.recurring_transactions(id,user_id) on delete cascade
);
alter table public.recurring_occurrences enable row level security;
do $$ begin
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='recurring_occurrences' and policyname='occurrence_owner') then
  create policy occurrence_owner on public.recurring_occurrences for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
 end if;
end $$;
revoke all on public.recurring_transactions,public.recurring_occurrences from anon,authenticated;
grant select,insert,update,delete on public.recurring_transactions to authenticated;
grant select,insert on public.recurring_occurrences to authenticated;
create or replace function public.generate_recurring_transactions() returns integer
language plpgsql security invoker set search_path='' as $$
declare r record; n integer; due date; receipt integer; total integer:=0;
 today date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 for r in select * from public.recurring_transactions where user_id=auth.uid() and enabled order by id for update loop
  n:=0;
  loop
   due := case r.frequency
    when 'weekly' then r.start_date + n*7
    when 'monthly' then (r.start_date + make_interval(months=>n))::date
    else (r.start_date + make_interval(years=>n))::date end;
   exit when due>today or (r.end_date is not null and due>r.end_date);
   if r.last_generated_on is null or due>r.last_generated_on then
    insert into public.recurring_occurrences(recurring_id,user_id,occurrence_date) values(r.id,r.user_id,due) on conflict do nothing;
    get diagnostics receipt=row_count;
    if receipt>0 then
     insert into public.transactions(user_id,type,amount,category_id,date,note,recurring_id,occurrence_date)
      values(r.user_id,r.type,r.amount,r.category_id,due,r.note,r.id,due) on conflict do nothing;
     total:=total+1;
    end if;
    update public.recurring_transactions set last_generated_on=due where id=r.id;
   end if;
   n:=n+1;
  end loop;
 end loop;
 return total;
end $$;
revoke all on function public.generate_recurring_transactions() from public,anon;
grant execute on function public.generate_recurring_transactions() to authenticated;
commit;
