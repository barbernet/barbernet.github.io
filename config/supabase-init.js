// config/supabase-init.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { supabaseConfig } from "./config.js";

/**
 * إنشاء عميل Supabase باستخدام الإعدادات المستوردة
 */
export const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);

export default supabase;

