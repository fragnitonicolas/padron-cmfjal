create table public.afiliados (
  id uuid primary key default gen_random_uuid(),
  nro_legajo integer unique,
  dni text unique,
  cuil text,
  apellido text not null,
  nombres text,
  apellido_y_nombre_original text not null,
  fecha_nacimiento date,
  email text,
  telefono text,
  domicilio text,
  categoria categoria_afiliado,
  cargo_id uuid references public.cargos(id),
  cargo_texto text,
  organismo_id uuid references public.organismos(id),
  fecha_alta date,
  estado estado_afiliado not null default 'activo',
  fecha_baja date,
  motivo_baja text,
  observaciones text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  constraint chk_dni_formato check (dni is null or dni ~ '^[0-9]{7,8}$'),
  constraint chk_email_formato check (email is null or email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  constraint chk_baja_tiene_fecha check (estado <> 'baja' or fecha_baja is not null)
);

comment on table public.afiliados is 'Padrón de afiliados del Colegio. La baja es siempre lógica (estado=baja); nunca se borra un registro físicamente.';
comment on column public.afiliados.apellido_y_nombre_original is 'Texto tal como figuraba en el Excel origen ("APELLIDO Y NOMBRE" combinados sin separador confiable). apellido/nombres se completan con un separador heurístico (primer token = apellido) y deben revisarse manualmente.';
comment on column public.afiliados.cargo_texto is 'Texto de cargo con género gramatical preservado tal como figura en la fuente (ej. "Auxiliar Letrada"), para mostrar en pantalla. cargo_id referencia el catálogo neutro usado para filtrar/agrupar.';

create trigger trg_afiliados_updated_at
  before update on public.afiliados
  for each row execute function public.fn_set_updated_at();

create index idx_afiliados_apellido on public.afiliados (apellido);
create index idx_afiliados_estado on public.afiliados (estado);
create index idx_afiliados_categoria on public.afiliados (categoria);
create index idx_afiliados_organismo on public.afiliados (organismo_id);
create index idx_afiliados_cargo on public.afiliados (cargo_id);
create index idx_afiliados_busqueda on public.afiliados
  using gin (to_tsvector('spanish', coalesce(apellido,'') || ' ' || coalesce(nombres,'') || ' ' || coalesce(dni,'')));
create index idx_afiliados_created_by on public.afiliados(created_by);
create index idx_afiliados_updated_by on public.afiliados(updated_by);
