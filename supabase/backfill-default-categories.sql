-- Run after schema.sql for accounts created before the schema was installed.
-- Only seed users who have no categories; preserve custom categories.
begin;
insert into public.categories (user_id, name, color, emoji, type)
select u.id, defaults.name, defaults.color, defaults.emoji, defaults.type
from auth.users u
cross join (values
  ('Ăn uống', '#F97316', '🍜', 'expense'),
  ('Đi lại', '#3B82F6', '🛵', 'expense'),
  ('Nhà ở', '#8B5CF6', '🏠', 'expense'),
  ('Mua sắm', '#EC4899', '🛍️', 'expense'),
  ('Giải trí', '#EAB308', '🎬', 'expense'),
  ('Sức khỏe', '#EF4444', '💊', 'expense'),
  ('Học tập', '#06B6D4', '📚', 'expense'),
  ('Lương', '#22C55E', '💼', 'income'),
  ('Khác', '#64748B', '📌', 'expense'),
  ('Khác', '#64748B', '📌', 'income')
) as defaults(name, color, emoji, type)
where not exists (select 1 from public.categories c where c.user_id = u.id)
on conflict (user_id, type, name) do nothing;
notify pgrst, 'reload schema';
commit;
