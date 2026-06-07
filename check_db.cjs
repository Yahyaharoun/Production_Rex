const fs = require('fs');
const envStr = fs.readFileSync('.env.production', 'utf8');
const env = envStr.split('\n').reduce((acc, line) => {
  const [k, v] = line.split('=');
  if (k && v) {
    acc[k.trim()] = v.replace(/^"|"$/g, '').trim();
  }
  return acc;
}, {});
const key = env.VITE_SUPABASE_ANON_KEY;
const url = env.VITE_SUPABASE_URL + '/rest/v1/vehicles?limit=1';
fetch(url, { headers: { apikey: key, Authorization: 'Bearer ' + key } })
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
