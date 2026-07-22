const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const failures = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function expect(condition, message) {
  if (!condition) failures.push(message);
}

function expectIncludes(content, expected, file) {
  expect(content.includes(expected), `${file} is missing: ${expected}`);
}

function expectExcludes(content, forbidden, file) {
  expect(!content.includes(forbidden), `${file} contains forbidden value: ${forbidden}`);
}

const packageJson = readJson('package.json');
const tauriConfig = readJson('src-tauri/tauri.conf.json');
const announcements = readJson('announcements.json');

expect(tauriConfig.productName === 'Cockpit Tools Clean', 'Clean product name changed');
expect(
  tauriConfig.identifier === 'com.taol20501.cockpit-tools-clean',
  'Clean application identifier changed',
);
expect(
  tauriConfig.version === packageJson.version,
  'package.json and tauri.conf.json versions differ',
);
expect(tauriConfig.bundle?.createUpdaterArtifacts === true, 'Updater artifacts are disabled');

const updater = tauriConfig.plugins?.updater;
const cleanReleaseBase =
  'https://github.com/taol20501-sudo/cockpit-tools-clean/releases/latest/download/';
const cleanUpdaterPublicKey =
  'dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IEJCQUVENkI0QzEyNEMwRUIKUldUcndDVEJ0TmF1dTZIVlNHdFBoWmdOU1MvTkxyOGgyQWFjdFRxQlNOOUZ5RGU2QVJlRlVXT2oK';
expect(updater?.pubkey === cleanUpdaterPublicKey, 'Clean updater public key changed');
expect(
  Array.isArray(updater?.endpoints) &&
    updater.endpoints.length === 2 &&
    updater.endpoints.every((url) => url.startsWith(cleanReleaseBase)),
  'Updater endpoints no longer point only to the Clean repository',
);

expect(announcements.apiRelayEnabled === false, 'API relay advertisement was re-enabled');
expect(announcements.topRightAdsEnabled === false, 'Top-right advertisements were re-enabled');
expect(announcements.topRightAd === null, 'Legacy top-right advertisement is not empty');
expect(Array.isArray(announcements.topRightAds) && announcements.topRightAds.length === 0, 'Advertisement list is not empty');
expect(announcements.sponsorModule === null, 'Sponsor module was re-enabled');
expect(Array.isArray(announcements.announcements) && announcements.announcements.length === 0, 'Bundled announcements are not empty');

const desktopAnnouncement = read('src-tauri/src/modules/announcement.rs');
const coreAnnouncement = read('crates/cockpit-core/src/modules/announcement.rs');
const remoteConfig = read('src-tauri/src/modules/remote_config.rs');
const settingsPage = read('src/pages/SettingsPage.tsx');
const updaterNotes = read('src/utils/updaterReleaseNotes.ts');
const topRightStore = read('src/stores/useTopRightAdStore.ts');
const sponsorStore = read('src/stores/useSponsorStore.ts');
const apiKeyLinks = read('src/utils/apikeyFunLinks.ts');

for (const [file, content] of [
  ['src-tauri/src/modules/announcement.rs', desktopAnnouncement],
  ['crates/cockpit-core/src/modules/announcement.rs', coreAnnouncement],
]) {
  expectIncludes(
    content,
    'raw.githubusercontent.com/taol20501-sudo/cockpit-tools-clean/main/announcements.json',
    file,
  );
  expectIncludes(content, 'popup_announcement: None', file);
  expectIncludes(content, 'ad: None', file);
  expectIncludes(content, 'ads: Vec::new()', file);
}

expectIncludes(
  remoteConfig,
  'raw.githubusercontent.com/taol20501-sudo/cockpit-tools-clean/main/remote-config.json',
  'src-tauri/src/modules/remote_config.rs',
);
expectIncludes(
  settingsPage,
  'https://github.com/taol20501-sudo/cockpit-tools-clean/issues',
  'src/pages/SettingsPage.tsx',
);
expectExcludes(settingsPage, 'jlcodes99/cockpit-tools/blob/main/docs/DONATE', 'src/pages/SettingsPage.tsx');
expectExcludes(updaterNotes, 'jlcodes99/cockpit-tools/releases', 'src/utils/updaterReleaseNotes.ts');
expectIncludes(updaterNotes, 'taol20501-sudo/cockpit-tools-clean/releases', 'src/utils/updaterReleaseNotes.ts');
expectExcludes(topRightStore, 'topRightAdService', 'src/stores/useTopRightAdStore.ts');
expectIncludes(topRightStore, 'localStorage.removeItem', 'src/stores/useTopRightAdStore.ts');
expectExcludes(sponsorStore, 'sponsorService', 'src/stores/useSponsorStore.ts');
expectExcludes(apiKeyLinks, 'register?aff=cockpit', 'src/utils/apikeyFunLinks.ts');

if (failures.length > 0) {
  console.error('Clean edition guard failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Clean edition guard passed for v${packageJson.version}.`);
