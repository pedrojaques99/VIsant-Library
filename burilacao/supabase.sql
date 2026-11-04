-- A burilação de copy. Rodar uma vez no Supabase do visant-board, o mesmo do lab.veredictos.
-- Só o service role lê e escreve, sempre pelas duas funções abaixo (`api/_lab-auth.ts`).

create schema if not exists lab;

create table if not exists lab.burilacao (
  duelo text not null,
  por text not null,
  escolha text not null check (escolha in ('a', 'b', 'nenhuma', 'minha')),
  motivos text[] not null default '{}',
  escrita text not null default '',
  data timestamptz not null default now(),
  primary key (duelo, por)
);

alter table lab.burilacao enable row level security;

create or replace function public.burilacao_votos()
returns table (duelo text, por text, escolha text, motivos text[], escrita text, data timestamptz)
language sql
security definer
set search_path = ''
as $$
  select v.duelo, v.por, v.escolha, v.motivos, v.escrita, v.data from lab.burilacao v order by v.data;
$$;

create or replace function public.burilacao_voto_put(
  p_duelo text,
  p_por text,
  p_escolha text,
  p_motivos text[],
  p_escrita text
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into lab.burilacao (duelo, por, escolha, motivos, escrita, data)
  values (p_duelo, p_por, p_escolha, p_motivos, p_escrita, now())
  on conflict (duelo, por) do update
    set escolha = excluded.escolha,
        motivos = excluded.motivos,
        escrita = excluded.escrita,
        data = now();
$$;

revoke all on function public.burilacao_votos() from public, anon, authenticated;
revoke all on function public.burilacao_voto_put(text, text, text, text[], text) from public, anon, authenticated;
grant execute on function public.burilacao_votos() to service_role;
grant execute on function public.burilacao_voto_put(text, text, text, text[], text) to service_role;
