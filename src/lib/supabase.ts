import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabaseConfigStatus: "ok" | "missing" | "suspicious" = (() => {
  if (!url || !anonKey) return "missing";
  // Новый формат publishable-ключей Supabase заметно длиннее 60 символов.
  // Короткий ключ почти наверняка вставлен не полностью.
  if (anonKey.length < 60 || !url.includes(".supabase.co")) return "suspicious";
  return "ok";
})();

export const supabase = createClient(
  url ?? "https://placeholder.supabase.co",
  anonKey ?? "placeholder-anon-key"
);
