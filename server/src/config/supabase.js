
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
  throw new Error(
    'Faltan SUPABASE_URL o SUPABASE_SECRET_KEY en el archivo .env'
  );
}

const supabase = createClient(
  supabaseUrl,
  supabaseSecretKey
);

export default supabase;
