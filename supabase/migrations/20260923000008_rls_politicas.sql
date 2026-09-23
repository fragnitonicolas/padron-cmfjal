alter table public.profiles enable row level security;
alter table public.organismos enable row level security;
alter table public.organismo_alias enable row level security;
alter table public.cargos enable row level security;
alter table public.cargo_alias enable row level security;
alter table public.afiliados enable row level security;
alter table public.auditoria enable row level security;
alter table public.importaciones enable row level security;
alter table public.importacion_filas enable row level security;

-- profiles
create policy profiles_select_propio_o_admin on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.es_admin());

create policy profiles_update_admin on public.profiles
  for update to authenticated
  using (public.es_admin())
  with check (public.es_admin());

create policy profiles_insert_admin on public.profiles
  for insert to authenticated
  with check (public.es_admin());

-- catálogos: lectura para cualquier usuario autenticado activo, escritura admin/editor
create policy organismos_select on public.organismos
  for select to authenticated using (public.esta_autenticado_activo());
create policy organismos_insert on public.organismos
  for insert to authenticated with check (public.puede_editar());
create policy organismos_update on public.organismos
  for update to authenticated using (public.puede_editar()) with check (public.puede_editar());

create policy organismo_alias_select on public.organismo_alias
  for select to authenticated using (public.esta_autenticado_activo());
create policy organismo_alias_insert on public.organismo_alias
  for insert to authenticated with check (public.puede_editar());
create policy organismo_alias_update on public.organismo_alias
  for update to authenticated using (public.puede_editar()) with check (public.puede_editar());
create policy organismo_alias_delete on public.organismo_alias
  for delete to authenticated using (public.puede_editar());

create policy cargos_select on public.cargos
  for select to authenticated using (public.esta_autenticado_activo());
create policy cargos_insert on public.cargos
  for insert to authenticated with check (public.puede_editar());
create policy cargos_update on public.cargos
  for update to authenticated using (public.puede_editar()) with check (public.puede_editar());

create policy cargo_alias_select on public.cargo_alias
  for select to authenticated using (public.esta_autenticado_activo());
create policy cargo_alias_insert on public.cargo_alias
  for insert to authenticated with check (public.puede_editar());
create policy cargo_alias_update on public.cargo_alias
  for update to authenticated using (public.puede_editar()) with check (public.puede_editar());
create policy cargo_alias_delete on public.cargo_alias
  for delete to authenticated using (public.puede_editar());

-- afiliados: lectura para cualquier autenticado activo (admin/editor/lector); escritura admin/editor; sin delete físico
create policy afiliados_select on public.afiliados
  for select to authenticated using (public.esta_autenticado_activo());
create policy afiliados_insert on public.afiliados
  for insert to authenticated with check (public.puede_editar());
create policy afiliados_update on public.afiliados
  for update to authenticated using (public.puede_editar()) with check (public.puede_editar());

-- auditoria: solo lectura admin/editor; sin insert/update/delete vía API (lo hace el trigger, ejecutado con privilegios de owner)
create policy auditoria_select on public.auditoria
  for select to authenticated using (public.puede_editar());

-- importaciones: admin/editor
create policy importaciones_select on public.importaciones
  for select to authenticated using (public.puede_editar());
create policy importaciones_insert on public.importaciones
  for insert to authenticated with check (public.puede_editar());
create policy importaciones_update on public.importaciones
  for update to authenticated using (public.puede_editar()) with check (public.puede_editar());

create policy importacion_filas_select on public.importacion_filas
  for select to authenticated using (public.puede_editar());
create policy importacion_filas_insert on public.importacion_filas
  for insert to authenticated with check (public.puede_editar());
