-- E-mails e feedback de quem instala as skills. Rodar uma vez no Supabase do lab.veredictos.
-- É dado pessoal: guarda só o e-mail, de onde veio e quando. Só o service role lê e escreve.

create schema if not exists lab;

create table if not exists lab.interesse (
  email text primary key,
  origem text not null,
  em timestamptz not null default now()
);

create table if not exists lab.feedback (
  id bigint generated always as identity primary key,
  texto text not null,
  origem text not null,
  em timestamptz not null default now()
);

alter table lab.interesse enable row level security;
alter table lab.feedback enable row level security;

create or replace function public.interesse_put(p_email text, p_origem text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into lab.interesse (email, origem) values (p_email, p_origem)
  on conflict (email) do nothing;
$$;

create or replace function public.feedback_put(p_texto text, p_origem text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into lab.feedback (texto, origem) values (p_texto, p_origem);
$$;

create or replace function public.interesse_sair(p_email text)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from lab.interesse where email = p_email;
$$;

create or replace function public.interesse_lista()
returns table (email text, origem text, em timestamptz)
language sql
security definer
set search_path = ''
as $$
  select i.email, i.origem, i.em from lab.interesse i order by i.em desc;
$$;

create or replace function public.feedback_lista()
returns table (texto text, origem text, em timestamptz)
language sql
security definer
set search_path = ''
as $$
  select f.texto, f.origem, f.em from lab.feedback f order by f.em desc limit 200;
$$;

revoke all on function public.interesse_put(text, text) from public, anon, authenticated;
revoke all on function public.feedback_put(text, text) from public, anon, authenticated;
revoke all on function public.interesse_sair(text) from public, anon, authenticated;
revoke all on function public.interesse_lista() from public, anon, authenticated;
revoke all on function public.feedback_lista() from public, anon, authenticated;
grant execute on function public.interesse_put(text, text) to service_role;
grant execute on function public.feedback_put(text, text) to service_role;
grant execute on function public.interesse_sair(text) to service_role;
grant execute on function public.interesse_lista() to service_role;
grant execute on function public.feedback_lista() to service_role;
