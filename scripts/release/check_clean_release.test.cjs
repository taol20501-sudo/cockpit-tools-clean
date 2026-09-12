const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { checkCleanRelease } = require('./check_clean_release.cjs');

function fixture() {
  const repo = 'taol20501-sudo/cockpit-tools-clean';
  const version = '1.3.49';
  const names = {
    'darwin-aarch64-app': 'Cockpit.Tools.Clean_aarch64.app.tar.gz',
    'darwin-x86_64-app': 'Cockpit.Tools.Clean_x64.app.tar.gz',
    'windows-x86_64-msi': 'Cockpit.Tools.Clean_1.3.49_x64_en-US.msi',
    'windows-x86_64-nsis': 'Cockpit.Tools.Clean_1.3.49_x64-setup.exe',
    'linux-x86_64-appimage': 'Cockpit.Tools.Clean_1.3.49_amd64.AppImage',
    'linux-x86_64-deb': 'Cockpit.Tools.Clean_1.3.49_amd64.deb',
    'linux-x86_64-rpm': 'Cockpit.Tools.Clean-1.3.49-1.x86_64.rpm',
    'linux-aarch64-appimage': 'Cockpit.Tools.Clean_1.3.49_aarch64.AppImage',
    'linux-aarch64-deb': 'Cockpit.Tools.Clean_1.3.49_arm64.deb',
    'linux-aarch64-rpm': 'Cockpit.Tools.Clean-1.3.49-1.aarch64.rpm',
  };
  const manifest = { version, platforms: {} };
  const assetNames = ['latest.json', 'SHA256SUMS.txt'];
  for (const [target, name] of Object.entries(names)) {
    manifest.platforms[target] = {
      signature: 'test-signature',
      url: `https://github.com/${repo}/releases/download/v${version}/${name}`,
    };
    assetNames.push(name, `${name}.sig`, `latest-${target}.json`);
  }
  return { repo, version, manifest, release: {
    tagName: `v${version}`, isDraft: false, isPrerelease: false,
    assets: assetNames.map((name) => ({ name, state: 'uploaded', size: 1 })),
  } };
}

test('accepts a complete Clean release', () => assert.equal(checkCleanRelease(fixture()), true));
for (const [label, mutate] of [
  ['upstream repository', (f) => { f.repo = 'jlcodes99/cockpit-tools'; }],
  ['previous updater', (f) => { f.manifest.version = '1.3.16'; }],
  ['empty bootstrap', (f) => { f.manifest.platforms = {}; }],
  ['missing Windows installer', (f) => { f.release.assets = f.release.assets.filter((a) => !a.name.endsWith('.exe')); }],
  ['missing signature', (f) => { f.release.assets = f.release.assets.filter((a) => !a.name.endsWith('.exe.sig')); }],
  ['missing checksums', (f) => { f.release.assets = f.release.assets.filter((a) => a.name !== 'SHA256SUMS.txt'); }],
  ['draft', (f) => { f.release.isDraft = true; }],
  ['upstream installer URL', (f) => { f.manifest.platforms['windows-x86_64-nsis'].url = f.manifest.platforms['windows-x86_64-nsis'].url.replace(f.repo, 'jlcodes99/cockpit-tools'); }],
]) {
  test(`rejects ${label}`, () => {
    const f = fixture();
    mutate(f);
    assert.throws(() => checkCleanRelease(f));
  });
}
test('sync pins gh operations to the Clean workflow repository', () => {
  const source = fs.readFileSync(path.join(__dirname, '../../.github/workflows/sync-upstream.yml'), 'utf8');
  assert.ok(source.includes('GH_REPO: ${{ github.repository }}'));
  assert.ok(source.includes('gh workflow run release.yml --ref main --repo "${GH_REPO}"'));
  assert.ok(source.includes('node scripts/release/check_clean_release.cjs'));
});
