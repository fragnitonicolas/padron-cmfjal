create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre_completo text not null,
  rol rol_usuario not null default 'lector',
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Perfiles de usuarios internos del sistema (creados solo por un administrador, sin alta pública).';

create or replace function public.fn_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.fn_set_updated_at();
