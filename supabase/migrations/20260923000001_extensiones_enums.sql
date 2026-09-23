create extension if not exists pgcrypto;

create type rol_usuario as enum ('admin', 'editor', 'lector');
create type estado_afiliado as enum ('activo', 'licencia', 'baja', 'fallecido');
create type categoria_afiliado as enum ('magistrado', 'funcionario', 'jubilado', 'otra');
create type accion_auditoria as enum ('INSERT', 'UPDATE');
