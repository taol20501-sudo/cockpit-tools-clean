const fs = require('node:fs');
const path = require('node:path');
const { TARGET_SPECS } = require('./build_target_latest_json.cjs');
const { CLEAN_TARGETS, LEGACY_ALIASES } = require('./clean_release_policy.cjs');

function buildCleanManifest({ version, repo, assetsDir, notes, publishedAt }) {
  if (repo !== 'taol20501-sudo/cockpit-tools-clean') throw new Error('Expected Clean repository');
  if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('Invalid version');
  const time = Date.parse(publishedAt);
  if (Number.isNaN(time)) throw new Error('Invalid publication date');
  const files = fs.readdirSync(assetsDir).filter((file) => fs.statSync(path.join(assetsDir, file)).isFile());
  const platforms = {};
  for (const target of CLEAN_TARGETS) {
    const matches = files.filter((name) => TARGET_SPECS[target].test(name));
    if (matches.length !== 1) throw new Error(`Expected one installer for ${target}`);
    const name = matches[0];
    const signature = fs.readFileSync(path.join(assetsDir, name + '.sig'), 'utf8').trim();
    if (!signature) throw new Error(`Missing signature for ${target}`);
    platforms[target] = { signature, url: `https://github.com/${repo}/releases/download/v${version}/${encodeURIComponent(name)}` };
  }
  for (const [alias, target] of Object.entries(LEGACY_ALIASES)) platforms[alias] = { ...platforms[target] };
  return { version, notes, pub_date: new Date(time).toISOString(), platforms };
}
if (require.main === module) {
  try {
    const args = {};
    for (let i = 2; i < process.argv.length; i += 2) args[process.argv[i].slice(2)] = process.argv[i + 1];
    const manifest = buildCleanManifest({
      version: args.version, repo: args.repo, assetsDir: args['assets-dir'],
      notes: fs.readFileSync(args['notes-file'], 'utf8').trim(), publishedAt: args['published-at'],
    });
    fs.writeFileSync(args.output || 'latest.json', JSON.stringify(manifest, null, 2) + '\n');
    console.log('Built Windows/macOS Clean updater manifest with legacy aliases.');
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { buildCleanManifest };
