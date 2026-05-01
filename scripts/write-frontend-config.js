const fs = require('fs');
const path = require('path');

const config = {
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  apiBaseUrl: process.env.FRONTEND_API_BASE_URL || ''
};

const output = `window.START_INNOVA_CONFIG = ${JSON.stringify(config, null, 2)};\n`;
fs.writeFileSync(path.join(process.cwd(), 'frontend-config.js'), output);

console.log('Wrote frontend-config.js');

