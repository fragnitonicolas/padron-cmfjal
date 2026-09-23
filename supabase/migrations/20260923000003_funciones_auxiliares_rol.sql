create or replace function public.mi_rol()
returns rol_usuario
language sql
stable
security definer
set search_path = public
as $$
  select rol from public.profiles
  where id = auth.uid() and activo = true;
$$;

comment on function public.mi_rol() is 'Devuelve el rol del usuario autenticado actual, o NULL si no tiene perfil activo. Usada en políticas de RLS.';

create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.mi_rol() = 'admin';
$$;

create or replace function public.puede_editar()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.mi_rol() in ('admin', 'editor');
$$;

create or replace function public.esta_autenticado_activo()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.mi_rol() is not null;
$$;
