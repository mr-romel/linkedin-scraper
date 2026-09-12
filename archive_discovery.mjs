import fs from 'node:fs/promises';

const ARCHIVE = 'artifacts/lead-archive.json';
const now = new Date().toISOString();

async function readJson(path, fallback) {
  try { return JSON.parse(await fs.readFile(path, 'utf8')); } catch { return fallback; }
}

function keyOf(row) {
  const linkedin = String(row.linkedin_url || '').trim().toLowerCase();
  const emails = Array.isArray(row.public_emails) ? row.public_emails : [];
  const email = String(row.email || emails[0] || '').trim().toLowerCase();
  const name = String(row.name || '').trim().toLowerCase();
  const company = String(row.company || '').trim().toLowerCase();
  const role = String(row.role || '').trim().toLowerCase();
  return linkedin || email || `${name}|${company}|${role}`;
}

function merge(existing, row, source) {
  const merged = { ...existing, ...row };
  merged.archive_key = keyOf(row) || existing.archive_key;
  merged.first_seen_at = existing.first_seen_at || now;
  merged.last_seen_at = now;
  merged.sources = [...new Set([...(existing.sources || []), source, row.source || ''])].filter(Boolean);
  merged.source_history = [...(existing.source_history || []), {
    at: now,
    source,
    query: row.query || '',
    engine: row.engine || '',
    discovery_score: Number(row.discovery_score) || 0,
    qualification_score: Number(row.qualification_score) || 0
  }].slice(-50);
  merged.public_emails = [...new Set([...(existing.public_emails || []), ...(row.public_emails || [])])];
  merged.public_phones = [...new Set([...(existing.public_phones || []), ...(row.public_phones || [])])];
  merged.discovery_score = Math.max(Number(existing.discovery_score) || 0, Number(row.discovery_score) || 0);
  merged.qualification_score = Math.max(Number(existing.qualification_score) || 0, Number(row.qualification_score) || 0);
  return merged;
}

const archive = await readJson(ARCHIVE, { version: 1, generated_at: now, leads: [], runs: [] });
const map = new Map((archive.leads || []).map(row => [row.archive_key || keyOf(row), row]));
let added = 0;
let updated = 0;

for (const [path, source] of [
  ['artifacts/linkedin-decision-makers.json', 'LinkedIn public search'],
  ['artifacts/google-deep-discovery.json', 'Google deep public search']
]) {
  const data = await readJson(path, null);
  for (const row of data?.leads || []) {
    const key = keyOf(row);
    if (!key || key === '||') continue;
    if (map.has(key)) updated += 1;
    else added += 1;
    map.set(key, merge(map.get(key), row, source));
  }
}

const leads = [...map.values()]
  .filter(row => row.archive_key)
  .sort((a, b) => (Number(b.qualification_score) || 0) - (Number(a.qualification_score) || 0));

archive.version = 1;
archive.generated_at = now;
archive.lead_count = leads.length;
archive.leads = leads;
archive.runs = [...(archive.runs || []), { at: now, added, updated, total: leads.length }].slice(-100);

await fs.mkdir('artifacts', { recursive: true });
await fs.writeFile(ARCHIVE, JSON.stringify(archive, null, 2));
console.log(JSON.stringify({ added, updated, total: leads.length }, null, 2));
