create table public.importaciones (
  id uuid primary key default gen_random_uuid(),
  nombre_archivo text not null,
  usuario_id uuid references public.profiles(id),
  fecha timestamptz not null default now(),
  total_filas integer not null default 0,
  insertados integer not null default 0,
  actualizados integer not null default 0,
  rechazados integer not null default 0,
  duplicados_omitidos integer not null default 0,
  estado text not null default 'completado',
  resumen jsonb
);
comment on table public.importaciones is 'Historial de lotes de importación del padrón desde Excel (carga inicial e incrementales posteriores).';

create table public.importacion_filas (
  id uuid primary key default gen_random_uuid(),
  importacion_id uuid not null references public.importaciones(id) on delete cascade,
  fila_excel integer not null,
  datos_originales jsonb not null,
  resultado text not null,
  motivo text,
  afiliado_id uuid references public.afiliados(id),
  created_at timestamptz not null default now()
);
create index idx_importacion_filas_importacion on public.importacion_filas(importacion_id);
create index idx_importacion_filas_afiliado on public.importacion_filas(afiliado_id);
create index idx_importaciones_usuario on public.importaciones(usuario_id);
