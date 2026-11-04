-- A curadoria em produção. Rodar uma vez no Supabase do visant-board, o mesmo do lab.veredictos.
-- Só o service role escreve e lê, sempre pelas duas funções abaixo (`api/_lab-auth.ts`).

create schema if not exists lab;

create table if not exists lab.curadoria (
  item text primary key,
  nota integer not null check (nota between 1 and 5),
  comentario text not null default '',
  excluir boolean not null default false,
  por text not null,
  data timestamptz not null default now()
);

alter table lab.curadoria enable row level security;

create or replace function public.curadoria_notas()
returns table (item text, nota integer, comentario text, excluir boolean, data timestamptz)
language sql
security definer
set search_path = ''
as $$
  select c.item, c.nota, c.comentario, c.excluir, c.data from lab.curadoria c order by c.item;
$$;

create or replace function public.curadoria_nota_put(
  p_item text,
  p_nota integer,
  p_comentario text,
  p_excluir boolean,
  p_por text
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into lab.curadoria (item, nota, comentario, excluir, por, data)
  values (p_item, p_nota, p_comentario, p_excluir, p_por, now())
  on conflict (item) do update
    set nota = excluded.nota,
        comentario = excluded.comentario,
        excluir = excluded.excluir,
        por = excluded.por,
        data = now();
$$;

revoke all on function public.curadoria_notas() from public, anon, authenticated;
revoke all on function public.curadoria_nota_put(text, integer, text, boolean, text) from public, anon, authenticated;
grant execute on function public.curadoria_notas() to service_role;
grant execute on function public.curadoria_nota_put(text, integer, text, boolean, text) to service_role;
