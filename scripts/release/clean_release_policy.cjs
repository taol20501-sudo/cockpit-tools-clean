const CLEAN_TARGETS = [
  'darwin-aarch64-app',
  'darwin-x86_64-app',
  'windows-x86_64-msi',
  'windows-x86_64-nsis',
];
const LEGACY_ALIASES = {
  'darwin-aarch64': 'darwin-aarch64-app',
  'darwin-x86_64': 'darwin-x86_64-app',
  'windows-x86_64': 'windows-x86_64-msi',
};
function isLinuxAsset(name) {
  return /^latest-linux-[a-z0-9_-]+\.json$/.test(name)
    || /^Cockpit\.Tools\.Clean[\w.-]*\.(?:AppImage|deb|rpm)(?:\.sig)?$/.test(name);
}
module.exports = { CLEAN_TARGETS, LEGACY_ALIASES, isLinuxAsset };
