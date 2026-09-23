import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Función administrativa: crear/listar/activar/desactivar usuarios internos
// y cambiar su rol. Requiere que quien llama tenga perfil con rol='admin'.
// Usa la service_role key SOLO para las operaciones de Auth Admin API que
// la requieren (crear usuario, listar emails); las lecturas/escrituras sobre
// public.profiles se hacen con el JWT de quien llama, para que RLS y el
// trigger de auditoría registren correctamente al administrador actuante.

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

// CORS: la función se llama desde el navegador (localhost en desarrollo,
// el dominio de Netlify en producción), un origen distinto al de Supabase,
// así que el navegador exige estos headers en la respuesta (incluida la
// preflight OPTIONS) o bloquea el fetch antes de que llegue acá.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return json({ error: "Método no permitido" }, 405);
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) return json({ error: "No autenticado" }, 401);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const asUser = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData.user) return json({ error: "Token inválido" }, 401);

  const { data: perfilActuante } = await admin
    .from("profiles")
    .select("rol, activo")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (!perfilActuante || perfilActuante.rol !== "admin" || !perfilActuante.activo) {
    return json({ error: "Esta acción requiere rol de administrador" }, 403);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "JSON inválido" }, 400);
  }

  const accion = body.accion;

  try {
    if (accion === "listar") {
      const { data: perfiles, error } = await asUser
        .from("profiles")
        .select("*")
        .order("created_at");
      if (error) throw error;

      const { data: listaAuth, error: errAuth } = await admin.auth.admin.listUsers();
      if (errAuth) throw errAuth;
      const emailPorId = new Map(listaAuth.users.map((u) => [u.id, u.email]));

      const resultado = (perfiles ?? []).map((p) => ({
        ...p,
        email: emailPorId.get(p.id) ?? null,
      }));
      return json({ usuarios: resultado });
    }

    if (accion === "crear") {
      const email = String(body.email ?? "").trim();
      const nombre_completo = String(body.nombre_completo ?? "").trim();
      const rol = String(body.rol ?? "");
      if (!email || !nombre_completo || !["admin", "editor", "lector"].includes(rol)) {
        return json({ error: "Faltan datos o el rol es inválido" }, 400);
      }

      const { data: nuevo, error } = await admin.auth.admin.inviteUserByEmail(email);
      if (error) throw error;
      if (!nuevo.user) throw new Error("No se pudo crear el usuario");

      const { error: errPerfil } = await asUser
        .from("profiles")
        .insert({ id: nuevo.user.id, nombre_completo, rol: rol as "admin" | "editor" | "lector" });
      if (errPerfil) throw errPerfil;

      return json({ ok: true, user_id: nuevo.user.id });
    }

    if (accion === "cambiar_rol") {
      const user_id = String(body.user_id ?? "");
      const rol = String(body.rol ?? "");
      if (!user_id || !["admin", "editor", "lector"].includes(rol)) {
        return json({ error: "Datos inválidos" }, 400);
      }
      const { error } = await asUser
        .from("profiles")
        .update({ rol: rol as "admin" | "editor" | "lector" })
        .eq("id", user_id);
      if (error) throw error;
      return json({ ok: true });
    }

    if (accion === "set_activo") {
      const user_id = String(body.user_id ?? "");
      const activo = Boolean(body.activo);
      if (!user_id) return json({ error: "Datos inválidos" }, 400);
      const { error } = await asUser.from("profiles").update({ activo }).eq("id", user_id);
      if (error) throw error;
      return json({ ok: true });
    }

    if (accion === "reenviar_invitacion") {
      const email = String(body.email ?? "").trim();
      if (!email) return json({ error: "Falta el email" }, 400);
      const { error } = await admin.auth.admin.inviteUserByEmail(email);
      if (error) throw error;
      return json({ ok: true });
    }

    return json({ error: "Acción desconocida" }, 400);
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : "Error inesperado";
    return json({ error: mensaje }, 500);
  }
});
