-- Fija search_path en funciones de trigger para mitigar search path hijacking.
create or replace function public.fn_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.fn_exigir_motivo_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if nullif(current_setting('app.motivo_cambio', true), '') is null then
    raise exception 'Debe indicarse un motivo para modificar este registro (app.motivo_cambio no seteado)';
  end if;
  return new;
end;
$$;

-- Las funciones de rol solo deben ser invocables por usuarios autenticados
-- (no por el rol anónimo ni por PUBLIC), y fn_auditoria_generica no debe
-- invocarse directamente vía RPC (solo la ejecuta el propio trigger).
revoke execute on function public.es_admin() from public;
revoke execute on function public.esta_autenticado_activo() from public;
revoke execute on function public.mi_rol() from public;
revoke execute on function public.puede_editar() from public;
revoke execute on function public.fn_auditoria_generica() from public;
revoke execute on function public.fn_set_updated_at() from public;
revoke execute on function public.fn_exigir_motivo_update() from public;

grant execute on function public.es_admin() to authenticated;
grant execute on function public.esta_autenticado_activo() to authenticated;
grant execute on function public.mi_rol() to authenticated;
grant execute on function public.puede_editar() to authenticated;

-- RLS del select de profiles usando (select auth.uid()) para permitir el
-- cacheo del plan por statement (advisor de performance).
drop policy if exists profiles_select_propio_o_admin on public.profiles;
create policy profiles_select_propio_o_admin on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.es_admin());

-- RPC para actualizar un afiliado dejando constancia del motivo del cambio
-- en la misma transacción (el trigger de auditoría lee app.motivo_cambio).
-- Se usa jsonb_populate_record para permitir updates parciales sin
-- interpolar nombres de columna (evita inyección SQL).
create or replace function public.actualizar_afiliado(p_id uuid, p_cambios jsonb, p_motivo text)
returns public.afiliados
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_resultado public.afiliados;
begin
  if p_motivo is null or trim(p_motivo) = '' then
    raise exception 'Debe indicarse un motivo para modificar el registro.';
  end if;

  perform set_config('app.motivo_cambio', p_motivo, true);

  update public.afiliados a
  set (apellido, nombres, apellido_y_nombre_original, fecha_nacimiento, email, telefono,
       domicilio, categoria, cargo_id, cargo_texto, organismo_id, fecha_alta, estado,
       fecha_baja, motivo_baja, observaciones, dni, cuil, nro_legajo, updated_by) =
      (select r.apellido, r.nombres, r.apellido_y_nombre_original, r.fecha_nacimiento, r.email, r.telefono,
              r.domicilio, r.categoria, r.cargo_id, r.cargo_texto, r.organismo_id, r.fecha_alta, r.estado,
              r.fecha_baja, r.motivo_baja, r.observaciones, r.dni, r.cuil, r.nro_legajo, (select auth.uid())
       from jsonb_populate_record(a, p_cambios) r)
  where a.id = p_id
  returning a.* into v_resultado;

  if v_resultado.id is null then
    raise exception 'No se pudo actualizar el registro: no existe o no tenés permisos suficientes.';
  end if;

  return v_resultado;
end;
$$;

revoke execute on function public.actualizar_afiliado(uuid, jsonb, text) from public;
grant execute on function public.actualizar_afiliado(uuid, jsonb, text) to authenticated;
