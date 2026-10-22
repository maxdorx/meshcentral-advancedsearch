'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const configPath = path.join(root, 'config.json');
const configText = fs.readFileSync(configPath, 'utf8');
const config = JSON.parse(configText);

assert.strictEqual(configText.trimStart()[0], '{', 'config.json must start with a JSON object');

for (const field of [
  'name',
  'shortName',
  'version',
  'author',
  'description',
  'homepage',
  'changelogUrl',
  'configUrl',
  'downloadUrl',
  'versionHistoryUrl'
]) {
  assert.strictEqual(typeof config[field], 'string', `${field} must be a string`);
  assert.ok(config[field].trim(), `${field} must not be empty`);
}

assert.strictEqual(typeof config.hasAdminPanel, 'boolean', 'hasAdminPanel must be a boolean');
assert.match(config.version, /^\d+\.\d+\.\d+$/, 'version must use semantic versioning');
assert.strictEqual(config.version, require('../package.json').version, 'manifest and package versions must match');
assert.match(config.changelogUrl, /\/CHANGELOG\.md$/, 'changelogUrl must point to CHANGELOG.md');
assert.match(config.configUrl, /\/config\.json$/, 'configUrl must point to config.json');
assert.match(
  config.downloadUrl,
  /^https:\/\/github\.com\/maxdorx\/meshcentral-advancedsearch\/archive\/refs\/heads\/main\.zip$/,
  'downloadUrl must use GitHub\'s generated archive'
);

for (const file of ['advancedsearch.js', 'config.json', 'CHANGELOG.md']) {
  assert.ok(fs.statSync(path.join(root, file)).isFile(), `${file} must be included at the plugin root`);
}

function readZipEntries(buffer) {
  let end = -1;
  for (let offset = buffer.length - 22; offset >= Math.max(0, buffer.length - 65557); offset--) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) {
      end = offset;
      break;
    }
  }
  assert.notStrictEqual(end, -1, 'archive must contain a ZIP end record');

  const count = buffer.readUInt16LE(end + 10);
  let offset = buffer.readUInt32LE(end + 16);
  const entries = [];
  for (let index = 0; index < count; index++) {
    assert.strictEqual(buffer.readUInt32LE(offset), 0x02014b50, 'archive central directory must be valid');
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    entries.push(buffer.toString('utf8', offset + 46, offset + 46 + nameLength));
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

const archivePath = path.join(os.tmpdir(), `meshcentral-advancedsearch-${process.pid}.zip`);
try {
  const archived = spawnSync('git', ['archive', '--format=zip', `--output=${archivePath}`, 'HEAD'], {
    cwd: root,
    encoding: 'utf8'
  });
  assert.strictEqual(archived.status, 0, archived.stderr || 'git archive failed');

  const entries = readZipEntries(fs.readFileSync(archivePath));
  for (const entry of entries.filter(name => name.includes('/') && !name.endsWith('/'))) {
    const parts = entry.split('/');
    parts.pop();
    let parent = '';
    for (const part of parts) {
      parent += `${part}/`;
      assert.ok(entries.includes(parent), `archive must include directory entry ${parent}`);
    }
  }
} finally {
  fs.rmSync(archivePath, { force: true });
}

console.log('PASS: manifest metadata, release URLs, runtime files, and ZIP directory entries.');
