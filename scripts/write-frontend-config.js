const fs = require('fs');
const path = require('path');

const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  '';
const apiBaseUrl = process.env.FRONTEND_API_BASE_URL || '';

const config = {
  supabaseUrl,
  supabaseAnonKey,
  apiBaseUrl
};

const missingCore = !supabaseUrl || !supabaseAnonKey;

if (missingCore && process.env.VERCEL) {
  console.error(
    'Build failed: set SUPABASE_URL and SUPABASE_ANON_KEY, or NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, in the Vercel project settings.'
  );
  process.exit(1);
}

if (missingCore) {
  console.warn(
    'Warning: Supabase URL or anon key missing. frontend-config.js will be incomplete until env is set (local: copy frontend-config.example.js or define variables).'
  );
}

const output = `window.START_INNOVA_CONFIG = ${JSON.stringify(config, null, 2)};\n`;
fs.writeFileSync(path.join(process.cwd(), 'frontend-config.js'), output);

console.log('Wrote frontend-config.js');

