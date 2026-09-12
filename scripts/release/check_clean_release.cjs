// Offline completeness check for the scheduled sync. A version number alone
// does not prove that a staged release contains all signed installation files.
const fs = require('node:fs');
const { TARGET_SPECS } = require('./build_target_latest_json.cjs');
const { validatePlatformEntry } = require('./verify_published_updater_manifests.cjs');

function checkCleanRelease({ version, repo, release, manifest }) {
  if (repo !== 'taol20501-sudo/cockpit-tools-clean') {
    throw new Error('Refusing to check a non-Clean release repository');
  }
  if (release.tagName !== `v${version}` || release.isDraft || release.isPrerelease) {
    throw new Error('Expected a published stable Clean release');
  }
  if (manifest.version !== version) throw new Error('Updater version is not current');
  const base = `https://github.com/${repo}/releases/download/v${version}`;
  const assets = new Set((release.assets || [])
    .filter((asset) => asset.size > 0 && asset.state === 'uploaded')
    .map((asset) => asset.name));
  const required = ['latest.json', 'SHA256SUMS.txt'];
  for (const target of Object.keys(TARGET_SPECS)) {
    const url = validatePlatformEntry(manifest.platforms?.[target], target, base, 'Clean latest.json');
    const name = decodeURIComponent(new URL(url).pathname.split('/').pop());
    required.push(name, `${name}.sig`, `latest-${target}.json`);
  }
  for (const name of required) {
    if (!assets.has(name)) throw new Error(`Missing uploaded release asset: ${name}`);
  }
  return true;
}

if (require.main === module) {
  try {
    const [version, repo, releaseFile, manifestFile] = process.argv.slice(2);
    checkCleanRelease({
      version, repo,
      release: JSON.parse(fs.readFileSync(releaseFile, 'utf8')),
      manifest: JSON.parse(fs.readFileSync(manifestFile, 'utf8')),
    });
    console.log(`Clean release v${version} has all signed updater targets and checksums.`);
  } catch (error) {
    console.error(`[check_clean_release] ${error.message}`);
    process.exitCode = 1;
  }
}
module.exports = { checkCleanRelease };
