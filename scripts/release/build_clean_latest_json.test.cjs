const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { buildCleanManifest } = require('./build_clean_latest_json.cjs');
const { CLEAN_TARGETS, LEGACY_ALIASES, isLinuxAsset } = require('./clean_release_policy.cjs');

test('builds only Windows/macOS entries and compatibility aliases', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'clean-release-test-'));
  try {
    const names = ['Cockpit.Tools.Clean_aarch64.app.tar.gz', 'Cockpit.Tools.Clean_x64.app.tar.gz',
      'Cockpit.Tools.Clean_1.3.61_x64_en-US.msi', 'Cockpit.Tools.Clean_1.3.61_x64-setup.exe'];
    for (const name of names) {
      fs.writeFileSync(path.join(dir, name), 'installer');
      fs.writeFileSync(path.join(dir, name + '.sig'), 'signature');
    }
    const args = { version: '1.3.61', repo: 'taol20501-sudo/cockpit-tools-clean', assetsDir: dir,
      notes: 'Unofficial modified edition', publishedAt: '2026-09-28T12:00:00Z' };
    const manifest = buildCleanManifest(args);
    assert.deepEqual(Object.keys(manifest.platforms).sort(), [...CLEAN_TARGETS, ...Object.keys(LEGACY_ALIASES)].sort());
    assert.equal(manifest.notes, args.notes);
    for (const [alias, target] of Object.entries(LEGACY_ALIASES)) assert.deepEqual(manifest.platforms[alias], manifest.platforms[target]);
    fs.writeFileSync(path.join(dir, names[0] + '.sig'), '');
    assert.throws(() => buildCleanManifest(args), /Missing signature/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
test('Linux filter preserves macOS ARM and Windows updater files', () => {
  for (const name of ['latest-linux-x86_64-deb.json', 'Cockpit.Tools.Clean_1.3.61_arm64.deb',
    'Cockpit.Tools.Clean-1.3.61-1.aarch64.rpm.sig', 'Cockpit.Tools.Clean_1.3.61_amd64.AppImage']) assert.ok(isLinuxAsset(name));
  for (const name of ['Cockpit.Tools.Clean_aarch64.app.tar.gz', 'Cockpit.Tools.Clean_1.3.61_aarch64.dmg',
    'latest-darwin-aarch64-app.json', 'latest-windows-x86_64-nsis.json', 'latest.json',
    'Cockpit.Tools.Clean_1.3.61_x64-setup.exe.sig']) assert.equal(isLinuxAsset(name), false);
});
test('release workflow builds Windows/macOS only', () => {
  const source = fs.readFileSync(path.join(__dirname, '../../.github/workflows/release.yml'), 'utf8');
  assert.ok(!source.includes('build-linux'));
  assert.ok(source.includes('node scripts/release/build_clean_latest_json.cjs'));
  assert.ok(source.includes('darwin-aarch64-app,darwin-x86_64-app,windows-x86_64-msi,windows-x86_64-nsis'));
});
