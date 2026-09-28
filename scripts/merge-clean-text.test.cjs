const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { normalize, mergeText } = require('./merge-clean-text.cjs');

test('drops only the sponsor section while accepting new features and keeping attribution', () => {
  const base = '# App\n\n## Sponsors\nold promotion\n\n---\n\n## Features\nold\n\n## License\noriginal author\n';
  const current = normalize(base, 'README.md');
  const incoming = base.replace('old promotion', 'new promotion').replace('Features\nold', 'Features\nnew');
  const merged = mergeText(base, current, incoming, 'README.md');
  assert.ok(!merged.includes('promotion'));
  assert.ok(merged.includes('Features\nnew'));
  assert.ok(merged.includes('original author'));
});
test('accepts API domain migration without restoring referral links', () => {
  const base = "export const APIKEY_FUN_REGISTER_URL = 'https://apikey.fun/register?aff=cockpit';\n";
  const current = normalize(base, 'src/utils/apikeyFunLinks.ts');
  const merged = mergeText(base, current, base.replace('.fun', '.fan'), 'src/utils/apikeyFunLinks.ts');
  assert.equal(merged, "export const APIKEY_FUN_REGISTER_URL = 'https://apikey.fan';\n");
});
test('does not discard unrelated conflicts', () => {
  assert.throws(() => mergeText('## Features\nbase\n', '## Features\nclean\n', '## Features\nupstream\n', 'README.md'), /Unresolved/);
});
test('rejects unapproved merge paths', () => {
  assert.throws(() => normalize('text', 'src/App.tsx'), /Unsupported/);
});
test('replays the real September upstream conflicts without losing Clean changes', () => {
  const read = (ref, file) => execFileSync('git', ['show', `${ref}:${file}`], { encoding: 'utf8' });
  for (const file of ['README.md', 'README.en.md', 'src/utils/apikeyFunLinks.ts']) {
    const merged = mergeText(read('95725f2ca', file), read('423dad983', file), read('7a8cab188', file), file);
    assert.ok(!/register\?aff=/i.test(merged));
    if (file.startsWith('README')) {
      assert.ok(merged.includes('taol20501-sudo/cockpit-tools-clean/releases'));
      assert.ok(!merged.includes('jlcodes99/cockpit-tools/releases'));
    } else {
      assert.ok(merged.includes('https://api.apikey.fan'));
    }
  }
});
