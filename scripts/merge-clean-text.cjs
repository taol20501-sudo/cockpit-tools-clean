const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

// Normalize only known promotional differences, then perform a real three-way
// merge. Unrelated overlapping edits still fail and require human review.
function normalize(text, file) {
  const value = text.replace(/\r\n/g, '\n');
  if (/^README(?:\.en|\.pt-br)?\.md$/.test(file)) {
    return value.replace(/^## (?:Sponsors|赞助商|Patrocinadores)[ \t]*\n[\s\S]*?(?=^## |$(?![\s\S]))/gm, '');
  }
  if (file === 'src/utils/apikeyFunLinks.ts') {
    return value.replace(/(export const APIKEY_FUN_REGISTER_URL = 'https:\/\/apikey\.(?:fun|fan))\/register\?aff=[^']*(';)/g, '$1$2');
  }
  throw new Error(`Unsupported Clean text merge path: ${file}`);
}

function mergeText(base, current, incoming, file) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'clean-text-merge-'));
  try {
    const files = ['current', 'base', 'incoming'].map((name) => path.join(dir, name));
    [current, base, incoming].forEach((value, index) => fs.writeFileSync(files[index], normalize(value, file)));
    const result = spawnSync('git', ['merge-file', '--stdout', ...files], { encoding: 'utf8' });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`Unresolved Clean text conflict in ${file}`);
    return result.stdout;
  } finally {
    // Only the exact directory just created by mkdtemp is removed.
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

if (require.main === module) {
  try {
    const [base, current, incoming, , file] = process.argv.slice(2);
    const merged = mergeText(...[base, current, incoming].map((name) => fs.readFileSync(name, 'utf8')), file);
    fs.writeFileSync(current, merged);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
module.exports = { normalize, mergeText };
