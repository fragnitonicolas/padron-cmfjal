create table public.auditoria (
  id bigint generated always as identity primary key,
  tabla text not null,
  registro_id uuid not null,
  accion accion_auditoria not null,
  usuario_id uuid references public.profiles(id),
  usuario_email text,
  motivo text,
  valores_anteriores jsonb,
  valores_nuevos jsonb,
  creado_en timestamptz not null default now()
);

comment on table public.auditoria is 'Registro inmutable de auditoría: quién, cuándo y qué cambió en cada tabla sensible. No admite UPDATE ni DELETE por ningún rol (ver políticas RLS).';

create index idx_auditoria_tabla_registro on public.auditoria (tabla, registro_id);
create index idx_auditoria_usuario on public.auditoria (usuario_id);
create index idx_auditoria_fecha on public.auditoria (creado_en desc);

create or replace function public.fn_auditoria_generica()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_motivo text;
  v_email text;
begin
  v_motivo := nullif(current_setting('app.motivo_cambio', true), '');
  select email into v_email from auth.users where id = auth.uid();

  if tg_op = 'INSERT' then
    insert into public.auditoria(tabla, registro_id, accion, usuario_id, usuario_email, motivo, valores_anteriores, valores_nuevos)
    values (tg_table_name, new.id, 'INSERT', auth.uid(), v_email, v_motivo, null, to_jsonb(new));
    return new;
  elsif tg_op = 'UPDATE' then
    insert into public.auditoria(tabla, registro_id, accion, usuario_id, usuario_email, motivo, valores_anteriores, valores_nuevos)
    values (tg_table_name, new.id, 'UPDATE', auth.uid(), v_email, v_motivo, to_jsonb(old), to_jsonb(new));
    return new;
  end if;
  return null;
end;
$$;

comment on function public.fn_auditoria_generica() is 'Trigger genérico de auditoría. Lee el motivo del cambio desde la variable de sesión app.motivo_cambio, seteada por la aplicación antes de UPDATE.';

create trigger trg_afiliados_auditoria
  after insert or update on public.afiliados
  for each row execute function public.fn_auditoria_generica();

create trigger trg_profiles_auditoria
  after insert or update on public.profiles
  for each row execute function public.fn_auditoria_generica();

-- Exige motivo obligatorio en toda modificación de un afiliado ya existente
-- (no aplica al alta inicial).
create or replace function public.fn_exigir_motivo_update()
returns trigger
language plpgsql
as $$
begin
  if nullif(current_setting('app.motivo_cambio', true), '') is null then
    raise exception 'Debe indicarse un motivo para modificar este registro (app.motivo_cambio no seteado)';
  end if;
  return new;
end;
$$;

create trigger trg_afiliados_exige_motivo
  before update on public.afiliados
  for each row execute function public.fn_exigir_motivo_update();
