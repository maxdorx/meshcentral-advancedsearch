'use strict';
const assert = require('assert');
const vm = require('vm');
const pluginModule = require('../advancedsearch.js');
const plugin = pluginModule.advancedsearch({});
assert.deepStrictEqual(plugin.exports, ['onWebUIStartupEnd']);
const source = plugin.onWebUIStartupEnd.toString();

const listeners = {};
const input = {
  value: '', title: '', addEventListener: (name, fn) => { listeners[name] = fn; }
};
const nodes = [
  { name: 'DAX-LAP-001', users: ['osama'], ip: '10.1.20.7', meshid: 'g1', osdesc: 'Windows 11', tags: ['Sales'], v: true },
  { name: 'OSAMA-PC', users: ['ali'], ip: '10.1.20.8', meshid: 'g1', osdesc: 'Linux', v: true },
  { name: 'DAX-LAP-003', users: ['hassan'], ip: '10.1.20.9', meshid: 'g2', osdesc: 'Windows 11', desc: 'Loaner issued to Osama', v: true },
  { name: 'DAX-LAP-004', users: ['mohamed'], ip: '10.1.30.8', meshid: 'g2', osdesc: 'Windows 10', tags: ['osama-support'], v: true },
  { name: 'DAX-LAP-005', users: ['zain'], ip: '10.1.40.9', meshid: 'g3', osdesc: 'Windows 11', v: true }
];
const meshes = { g1: { name: 'Finance' }, g2: { name: 'IT Support' }, g3: { name: 'Osama Group' } };
const rendered = [];
const stored = [];
let nativeCalls = 0;
const ctx = {
  document: { getElementById(id) { return id === 'SearchInput' ? input : null; } },
  navigator: { userAgent: 'Firefox' },
  nodes, meshes,
  putstore: (key, val) => stored.push([key,val]), QV: () => {},
  updateDevices: () => { rendered.push(nodes.filter(n => n.v).map(n => n.name)); },
  onSearchInputChanged: () => {
    nativeCalls++;
    nodes.forEach(n => { n.v = input.value === '' || n.name.toLowerCase().includes(input.value.toLowerCase()); });
    ctx.updateDevices();
  }
};
ctx.mainUpdate = flags => { if (flags & 1) ctx.onSearchInputChanged(); else if (flags & 4) ctx.updateDevices(); };
vm.createContext(ctx);
// Emulate the exact serialization path used by MeshCentral pluginHandler.
vm.runInContext('(' + source + ')()', ctx);
assert.strictEqual(typeof listeners.input, 'function', 'input handler is attached');
const wrapped = ctx.onSearchInputChanged;
vm.runInContext('(' + source + ')()', ctx);
assert.strictEqual(ctx.onSearchInputChanged, wrapped, 'hot reload does not double-wrap');
function search(q) { input.value = q; listeners.input(); return rendered[rendered.length - 1]; }
assert.deepStrictEqual(search('osama'), nodes.map(n => n.name), 'plain query searches users, name, descriptions, tags, and groups');
assert.deepStrictEqual(search('OSAMA'), nodes.map(n => n.name), 'case insensitive');
assert.deepStrictEqual(search('hass'), ['DAX-LAP-003'], 'username matches');
assert.deepStrictEqual(search('10.1.30'), ['DAX-LAP-004'], 'IP matches');
assert.deepStrictEqual(search('support'), ['DAX-LAP-003', 'DAX-LAP-004'], 'group and tag match');
assert.deepStrictEqual(search('osama linux'), ['OSAMA-PC'], 'AND terms across fields');
assert.deepStrictEqual(search('"it support" osama'), ['DAX-LAP-003', 'DAX-LAP-004'], 'quoted phrase and AND');
assert.deepStrictEqual(search('nomatch'), [], 'no matches');
assert.deepStrictEqual(search(''), nodes.map(n => n.name), 'clearing delegates to native');
const prior = nativeCalls;
search('ip:10.1.20');
assert.strictEqual(nativeCalls, prior+1, 'native prefixes delegate to native');
assert.deepStrictEqual(search('osama').length, 5, 'search recovers after native filter');
assert.ok(stored.some(pair => pair[0] === '_search' && pair[1] === 'osama'), 'query persisted');
assert.ok(input.title.includes('hostname'));
console.log('PASS: plugin exports, browser serialization, live input, all fields, AND, quoted phrases, native fallback, clear, hot reload.');
