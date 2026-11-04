-- As contagens do painel /admin. Rodar uma vez no Supabase do lab.veredictos.
-- Só totais por dia: tipo, item e número. Nenhuma pessoa, IP ou cookie entra aqui.
-- Só o service role lê e escreve, pelas duas funções abaixo (`api/_lab-auth.ts`).

create schema if not exists lab;

create table if not exists lab.contagem (
  tipo text not null,
  item text not null,
  dia date not null default current_date,
  n bigint not null default 0,
  primary key (tipo, item, dia)
);

alter table lab.contagem enable row level security;

create or replace function public.contagem_somar(p_linhas jsonb)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into lab.contagem (tipo, item, dia, n)
  select l.tipo, l.item, current_date, 1
  from jsonb_to_recordset(p_linhas) as l (tipo text, item text)
  on conflict (tipo, item, dia) do update set n = lab.contagem.n + 1;
$$;

create or replace function public.contagem_lista(p_dias integer)
returns table (tipo text, item text, dia date, n bigint)
language sql
security definer
set search_path = ''
as $$
  select c.tipo, c.item, c.dia, c.n
  from lab.contagem c
  where c.dia >= current_date - p_dias
  order by c.dia;
$$;

revoke all on function public.contagem_somar(jsonb) from public, anon, authenticated;
revoke all on function public.contagem_lista(integer) from public, anon, authenticated;
grant execute on function public.contagem_somar(jsonb) to service_role;
grant execute on function public.contagem_lista(integer) to service_role;
