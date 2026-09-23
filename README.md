# Padrón de Afiliados — Colegio de la Magistratura y la Función Judicial de Avellaneda-Lanús (CMFJAL)

Aplicación web para administrar el padrón de afiliados del Colegio: alta, edición, baja lógica, importación desde Excel, estadísticas, calidad de datos y auditoría completa de cambios.

## Stack

- **Frontend**: Vite + React 19 + TypeScript + Tailwind CSS v4 (plugin nativo de Vite, sin `tailwind.config.js`).
- **Backend**: Supabase (Postgres + Auth + Row Level Security + Edge Functions).
- **Hosting**: Netlify (build automático desde `main`), con `netlify.toml` incluido.
- **Librerías destacadas**: `react-router-dom`, `@supabase/supabase-js`, `react-hook-form` + `zod`, `exceljs` (lectura/escritura de Excel), `jspdf` (constancia de afiliación en PDF).

## Estructura

```
src/
  components/ui/       componentes reutilizables (botones, campos, modales, badges)
  components/layout/   layout con sidebar, ProtectedRoute
  features/padron/     tabla, ficha, alta, edición del padrón
  features/importacion/ asistente de importación de Excel
  features/usuarios/   alta/gestión de usuarios internos (vía Edge Function)
  features/dashboard/  estadísticas y cumpleaños del mes
  features/calidad/    panel de duplicados y campos incompletos
  features/auditoria/  visor del log de auditoría
  lib/                 cliente Supabase, validaciones (DNI/CUIL/email/teléfono), exportación, PDF
supabase/
  migrations/          esquema completo versionado (tablas, RLS, funciones, RPC)
  functions/
    admin-usuarios/     Edge Function para alta/gestión de usuarios internos
```

## 1. Instalación local

```bash
npm install
cp .env.example .env
```

Completá `.env` con la URL y la clave pública (`anon`/`publishable`) de tu proyecto Supabase:

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

```bash
npm run dev
```

`npm run build` corre `tsc -b && vite build`; el proyecto compila sin errores ni warnings de TypeScript.

## 2. Creación del proyecto Supabase y migraciones

Este proyecto ya tiene un backend Supabase creado (org `cmfjal`, proyecto `cmfjal-padron`, región `sa-east-1`). Para replicar el esquema en un proyecto nuevo (por ejemplo, para un ambiente de staging propio):

1. Creá un proyecto en [supabase.com](https://supabase.com).
2. Instalá la [CLI de Supabase](https://supabase.com/docs/guides/cli), logueate (`supabase login`) y vinculá el proyecto (`supabase link --project-ref tu-ref`).
3. Aplicá el esquema versionado en `supabase/migrations/` con `supabase db push`. Incluye extensiones, tablas, RLS, funciones, triggers y el RPC `actualizar_afiliado`. Los catálogos de organismos/cargos y la carga inicial del padrón **no** están en las migraciones (dependen de un Excel real) — se cargan desde la pantalla "Importación de Excel" una vez desplegada la app (ver sección 3).
4. Desplegá la Edge Function: `supabase functions deploy admin-usuarios`.
5. Copiá la URL del proyecto y la clave `anon`/`publishable` a tu `.env`.
6. Activá manualmente en el dashboard (**Authentication → Policies → Password**) la protección de contraseñas filtradas (*Leaked password protection*, integración con HaveIBeenPwned) — no se puede activar vía SQL/API pública, requiere un toggle en el dashboard.
7. Creá el primer administrador (ver sección 5).

## 3. Carga inicial del Excel

El padrón original (`PADRON AFILIADOS.xlsx`, 382 registros reales) fue normalizado y cargado como parte del desarrollo inicial mediante un script de una sola vez (no versionado en este repo por contener un mapeo específico de IDs generados). Para futuras cargas masivas o correcciones del padrón **usá la pantalla "Importación de Excel"** de la aplicación (menú lateral, visible para roles admin/editor):

1. El Excel debe tener en la primera fila las columnas: `NRO`, `DNI`, `LEGAJO`, `APELLIDO Y NOMBRE`, `ORGANISMO`, `CARGO` (es el formato del padrón original).
2. La pantalla muestra una vista previa fila por fila: altas nuevas, actualizaciones sobre registros existentes (matcheados por N° de legajo o DNI), filas sin cambios y filas rechazadas (sin apellido y nombre).
3. Los organismos y cargos que no se reconozcan automáticamente contra el catálogo existente se muestran para mapear manualmente a uno ya existente o crear uno nuevo (que queda memorizado como alias para la próxima importación).
4. Recién al confirmar se aplican los cambios; cada actualización sobre un afiliado existente queda registrada en el historial de auditoría con el motivo "Actualización por importación de padrón (archivo: ...)".

## 4. Configuración de Netlify

El repo incluye `netlify.toml` con:
- `command = "npm run build"`, `publish = "dist"`.
- Redirect SPA: `/* /index.html 200`.

Pasos:
1. Conectá el repositorio de GitHub en Netlify ("Add new site → Import an existing project").
2. En **Site settings → Environment variables**, agregá `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (los mismos valores de tu `.env`, nunca la `service_role`).
3. Deploy. Cada push a `main` dispara un build automático.

## 5. Alta del primer administrador

Ya existe un usuario administrador inicial creado directamente en la base (email `fragnitonicolas@gmail.com`, perfil con `rol = 'admin'`). Como no se generó ni se conoce una contraseña para esa cuenta (por seguridad, nunca se creó una contraseña legible por nadie más que el propio usuario), **el primer ingreso debe hacerse con "¿Olvidaste tu contraseña?"** desde la pantalla de login: se envía un correo con un enlace para definir la contraseña.

Para altas posteriores de usuarios: **Panel → Usuarios** (solo admin) permite invitar por email, asignar rol (`admin` / `editor` / `lector`) y activar/desactivar cuentas. No hay registro público: todo usuario se crea desde ahí.

### Cuentas operativas sin email real (login por nombre de usuario)

Además del ingreso por email, el login acepta un **nombre de usuario simple** (sin `@`): internamente se resuelve como `<usuario>@cmfjal.local`. Esto permite dar de alta cuentas de uso diario para personas o áreas del Colegio que no necesitan (o no tienen) una casilla de correo propia — por ejemplo, cuentas compartidas por rol. Estas cuentas:

- Se crean igual que cualquier otra directamente en la base (no reciben el email de invitación, porque `@cmfjal.local` no es un dominio real).
- **No pueden usar "¿Olvidaste tu contraseña?"** (no hay a dónde enviar el correo). En su lugar, cualquier usuario logueado puede cambiar su propia contraseña desde **"Cambiar contraseña"** en el menú lateral.
- Si un admin necesita resetear la contraseña de una de estas cuentas sin que la persona la sepa de antemano, debe hacerlo directamente desde el dashboard de Supabase (Authentication → Users) hasta que se decida agregar esa acción al panel de Usuarios.

## 6. Decisiones de diseño y supuestos (importante)

### Datos de origen — limitaciones del Excel

El Excel original **solo contenía 6 columnas**: `NRO`, `DNI`, `LEGAJO`, `APELLIDO Y NOMBRE`, `ORGANISMO`, `CARGO` (382 registros reales sobre 391 filas; las últimas 8 estaban vacías). Esto es mucho más acotado que el conjunto de campos "mínimos" solicitados originalmente. En consecuencia:

- **DNI**: solo estaba completo en 18 de 382 registros (~4,7%). Por eso **no puede usarse como clave natural principal**: el campo es único pero nullable, y la detección de duplicados usa además N° de legajo y similitud de nombre.
- **N° de legajo**: presente en 374/382 registros y es mucho más confiable como identificador; se usa como criterio principal para matchear altas vs. actualizaciones en importaciones incrementales. Es único (con una excepción: dos filas del Excel original — "COBBI MARCELO GABRIEL" y "COMBI MARCELO GABRIEL" — compartían el legajo 736045, evidentemente la misma persona cargada dos veces con un error de tipeo en el apellido; se conservó una sola fila).
- **CUIL, fecha de nacimiento, email, teléfono, domicilio, categoría, fecha de alta, estado, fecha/motivo de baja**: **no existían en el Excel**. Se agregaron todos como columnas de la tabla `afiliados` (nullable, salvo `estado` con default `'activo'`) para que el Colegio los complete progresivamente desde la ficha de cada afiliado. El panel "Calidad de datos" cuantifica cuántos registros faltan completar en cada campo.
- **Apellido / Nombres**: el Excel traía un único campo "APELLIDO Y NOMBRE" sin separador confiable. Se aplicó una heurística: el apellido es el primer token, extendido para incluir partículas iniciales (`DE`, `DEL`, `DI`, `DA`, `VAN`, `VON`, `LA`, `LAS`, `LOS`, o un token de una sola letra como en "D'Ambrosio") más el token siguiente, para cubrir apellidos compuestos ("DE LA FUENTE", "DI FRANCESCA"); el resto son los nombres. **Esta separación puede ser incorrecta en apellidos compuestos no cubiertos por la heurística** (p. ej. "DALL'OSPEDALE" quedó separado como apellido "DALL" + nombre "OSPEDALE..."). El texto original combinado se conserva siempre en `apellido_y_nombre_original` y se muestra en la ficha del afiliado para poder corregir manualmente.
- **Categoría** (`magistrado` / `funcionario` / `jubilado` / `otra`): no surge del Excel en absoluto. Quedó **sin poblar** (`null`) en la carga inicial; se agregó el enum y el campo para que se complete manualmente o vía importaciones futuras que sí la incluyan. No se asumió ningún criterio automático de asignación por cargo.
- **Estado** (`activo` / `licencia` / `baja` / `fallecido`): tampoco existe en el Excel. Todos los registros importados se cargaron como `activo` por ser el estado por defecto más razonable para un padrón vigente; el Colegio debe dar de baja manualmente los que correspondan.

### Normalización de organismos y cargos

- El Excel tenía **205 variantes de texto distintas** para "ORGANISMO" (mayúsculas/minúsculas, abreviaturas, typos como "JUAZGADO", "CORRECIONAL", espacios extra) que en realidad correspondían a muchos menos organismos reales. Se normalizaron automáticamente por tipo + número + localidad a **107 organismos canónicos**, con todas las variantes originales guardadas como alias (tabla `organismo_alias`) para que futuras importaciones las reconozcan.
  - **Supuesto de localidad**: cuando el Excel no indicaba localidad, se asumió que el organismo pertenece a Avellaneda-Lanús (la jurisdicción propia del Colegio), salvo que el texto mencionara explícitamente otra localidad (Lomas de Zamora, San Vicente), que se mantuvo como organismo aparte.
  - Esta normalización es un punto de partida razonable, no una verdad definitiva: **revisá el catálogo de organismos y corregí agrupamientos que consideres incorrectos** (por ejemplo, "TRIBUNAL ORAL N°3" y "TRIBUNAL ORAL CRIMINAL N°3 AVELLANEDA" podrían ser el mismo tribunal y quedaron separados por la heurística).
- De manera similar, **70 variantes de "CARGO"** (abreviaturas como "A.LETRADA", "AUX LETRADO", "OFIC. 4") se agruparon en **25 cargos canónicos**, con una `jerarquia_sugerida` (Magistrado/Funcionario/Empleado/Otro) puramente orientativa y no vinculante. El texto original con género gramatical preservado ("Auxiliar Letrada" vs. "Auxiliar Letrado") se guarda aparte en `cargo_texto` para mostrarse correctamente en la interfaz.

### Paleta de colores y diseño

El isotipo del Colegio (proporcionado como imagen) es **monocromático** (tinta negra sobre blanco/transparente): un sello circular clásico sin colores propios para extraer. Se derivó una paleta institucional propia —azul "justicia" sobrio (`brand-*`) con un acento dorado discreto (`gold-*`)— coherente con el carácter de un sello judicial tradicional, en lugar de inventar colores sin base. Tipografía serif (Source Serif 4) para títulos institucionales, sans-serif (Inter) para datos y formularios.

## 7. Seguridad

Los datos del padrón incluyen información personal de magistrados y funcionarios (nombre, DNI, domicilio, email, teléfono) alcanzada por la Ley 25.326 de Protección de Datos Personales. Medidas implementadas:

- **Sin registro público**: el login (`/ingresar`) es la única puerta de entrada; los usuarios se crean exclusivamente desde el panel de administración (Edge Function `admin-usuarios`, que usa la `service_role` key solo del lado del servidor, nunca expuesta al frontend).
- **Roles**: `admin` (todo, incluida gestión de usuarios), `editor` (alta/edición/baja de afiliados, importación, ve auditoría), `lector` (solo lectura y exportación). Aplicados con RLS en absolutamente todas las tablas (`profiles`, `organismos`, `organismo_alias`, `cargos`, `cargo_alias`, `afiliados`, `auditoria`, `importaciones`, `importacion_filas`).
- **Auditoría inmutable**: un trigger genérico (`fn_auditoria_generica`) registra automáticamente cada alta y modificación de `afiliados` y `profiles` en la tabla `auditoria` (usuario, fecha, valores anteriores y nuevos en JSON, motivo). La tabla `auditoria` no tiene políticas de `INSERT`/`UPDATE`/`DELETE` para ningún rol vía API — solo el trigger, ejecutado con privilegios del dueño de la tabla, puede escribir en ella.
- **Motivo obligatorio**: toda modificación de un afiliado existente pasa por la función `actualizar_afiliado(id, cambios, motivo)`, que rechaza la operación si no se indica un motivo (encolado en la misma transacción vía `set_config('app.motivo_cambio', ...)` para que el trigger de auditoría lo capture).
- **Baja lógica**: no existe ninguna vía en la interfaz para eliminar físicamente un afiliado. "Dar de baja" solo cambia `estado` a `'baja'` y registra fecha y motivo; el registro y su historial se conservan siempre.
- **Funciones `SECURITY DEFINER`** (`mi_rol`, `es_admin`, `puede_editar`, etc.) con `search_path` fijo (mitiga *search path hijacking*) y `EXECUTE` revocado a `PUBLIC`/`anon`, otorgado solo a `authenticated`.
- **Advisors de seguridad de Supabase** ejecutados antes de dar el proyecto por terminado. Quedan dos advertencias aceptadas conscientemente (documentadas acá en vez de "resueltas" a ciegas):
  1. *"Signed-In users can execute SECURITY DEFINER function"* sobre `mi_rol`/`es_admin`/`puede_editar`/`esta_autenticado_activo`: es intencional — son las funciones que usan las políticas RLS para resolver el rol del usuario autenticado contra su propio perfil; no exponen datos de terceros.
  2. *"Leaked password protection disabled"*: requiere activarse manualmente desde el dashboard de Supabase (Authentication → Policies), no es configurable vía SQL/migración. **Pendiente de activar por un administrador del proyecto.**
- **Dependencia `xlsx` evitada**: la librería SheetJS `xlsx` de npm tiene dos vulnerabilidades conocidas sin parche (prototype pollution y ReDoS). Se usa `exceljs` en su lugar, con una única advisory transitiva de baja severidad y bajo riesgo práctico (`uuid`, no explotable en el uso que hace `exceljs`).

## 8. Funcionalidades incluidas y por qué

Además de lo pedido explícitamente (padrón con búsqueda/filtros/orden/paginación/exportación, alta, edición/baja con motivo, importación con vista previa e importaciones incrementales), se agregó:

- **Constancia de afiliación en PDF**: generación de un PDF institucional con el logo, útil para trámites individuales de los afiliados.
- **Tablero de estadísticas**: conteos por estado/categoría/fuero/organismo y detección de campos de contacto faltantes — da visibilidad inmediata sobre la calidad y composición del padrón.
- **Cumpleaños del mes**: lista de afiliados activos que cumplen años en el mes en curso, exportable — es una necesidad típica de gestión de un colegio profesional.
- **Panel de calidad de datos**: detección automática de posibles duplicados (por DNI idéntico o nombre muy similar, distancia de Levenshtein) y conteo de campos incompletos.
- **Visor de auditoría**: además del historial por afiliado en su ficha, un panel global filtrable por tabla y usuario.

No se implementó un mecanismo de respaldo/export completo de la base más allá de las exportaciones CSV/Excel ya disponibles (Supabase ya provee backups automáticos a nivel de proyecto).

> Se evaluó incluir un generador de padrón electoral configurable, pero se descartó por pedido explícito: la funcionalidad se solapaba con el padrón principal (que ya permite filtrar por estado/categoría y exportar la vista filtrada) y no aportaba valor adicional suficiente para justificar una pantalla aparte.

## 9. Roles y permisos (resumen)

| Acción | Admin | Editor | Lector |
|---|---|---|---|
| Ver padrón, exportar, estadísticas | ✅ | ✅ | ✅ |
| Alta / edición / baja de afiliados | ✅ | ✅ | ❌ |
| Importar Excel | ✅ | ✅ | ❌ |
| Ver auditoría | ✅ | ✅ | ❌ |
| Gestionar usuarios | ✅ | ❌ | ❌ |

## 10. Verificación

- `npm run build` corre sin errores ni warnings de TypeScript.
- Advisors de seguridad y performance de Supabase revisados (ver sección 7).
- Probado en navegador: pantalla de login, redirección de rutas protegidas sin sesión, flujo de recuperación de contraseña (envío real de correo). Los flujos autenticados (tabla del padrón, alta/edición, importación, panel de usuarios) fueron verificados por revisión de código y tipado estricto; no se completó una prueba interactiva end-to-end con sesión iniciada porque no se generó ni se conoce una contraseña para ninguna cuenta real (ver sección 5) — usá "¿Olvidaste tu contraseña?" para entrar por primera vez y verificarlos vos mismo.
