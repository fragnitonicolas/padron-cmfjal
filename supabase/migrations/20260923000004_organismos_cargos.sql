create table public.organismos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  fuero text,
  localidad text,
  tipo text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.organismos is 'Catálogo normalizado de organismos/dependencias (juzgados, tribunales, fiscalías, defensorías, etc). Se completa por normalización automática del padrón importado y se corrige manualmente desde el panel.';

create trigger trg_organismos_updated_at
  before update on public.organismos
  for each row execute function public.fn_set_updated_at();

create table public.organismo_alias (
  id uuid primary key default gen_random_uuid(),
  organismo_id uuid not null references public.organismos(id) on delete cascade,
  alias_texto text not null unique,
  created_at timestamptz not null default now()
);
comment on table public.organismo_alias is 'Variantes de texto tal como figuran en excels de origen, mapeadas a un organismo canónico, para que futuras importaciones reconozcan automáticamente el mismo organismo.';
create index idx_organismo_alias_organismo on public.organismo_alias(organismo_id);

create table public.cargos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  jerarquia_sugerida text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.cargos is 'Catálogo normalizado de cargos/roles judiciales. jerarquia_sugerida es orientativa (Magistrado/Funcionario/Empleado/Otro), no vinculante ni estatutaria.';

create trigger trg_cargos_updated_at
  before update on public.cargos
  for each row execute function public.fn_set_updated_at();

create table public.cargo_alias (
  id uuid primary key default gen_random_uuid(),
  cargo_id uuid not null references public.cargos(id) on delete cascade,
  alias_texto text not null unique,
  created_at timestamptz not null default now()
);
create index idx_cargo_alias_cargo on public.cargo_alias(cargo_id);
