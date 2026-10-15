'use strict';

// MeshCentral web-UI-only plugin. No database, agent, or server changes.
// MeshCentral serializes exported browser functions using Function#toString,
// so onWebUIStartupEnd MUST remain self-contained.
module.exports.advancedsearch = function (parent) {
    var plugin = { parent: parent };
    plugin.exports = ['onWebUIStartupEnd'];

    plugin.onWebUIStartupEnd = function () {
        var input = document.getElementById('SearchInput');
        if (!input || typeof onSearchInputChanged !== 'function') return;
        if (onSearchInputChanged._advancedsearchOriginal) return; // hot reload guard

        var nativeSearch = onSearchInputChanged;
        var nativePrefixes = /^(?:user|u|ip|group|g|tag|t|atag|os|desc|amt|wsc):/i;

        // Only search fields already supplied to this authenticated web UI.
        // Don't JSON.stringify a whole node: it can include irrelevant/internal data.
        function text(value) {
            if (value == null) return '';
            if (Array.isArray(value)) return value.map(text).join(' ');
            if (typeof value === 'object') {
                // User and tag values can be represented as objects by some builds.
                return Object.keys(value).map(function (k) {
                    return text(value[k]);
                }).join(' ');
            }
            return String(value).toLowerCase();
        }

        function searchableText(node) {
            var group = (typeof meshes !== 'undefined' && meshes && node.meshid && meshes[node.meshid]) ? meshes[node.meshid].name : '';
            return text([
                node.name, node.namel, node.rname, node.rnamel,
                node.host, node.hostl,
                node.users, node.user, node.username, node.lastuser, node.lastUser, node.connusers,
                node.ip, node.publicip, node.wanip,
                group, node.meshnamel, node.tags, node.tag, node.agent && node.agent.tag,
                node.osdesc, node.osname, node.desc, node.description
            ]);
        }

        // Spaces are AND, quoted phrases are kept together. A single word
        // searches all supported fields without any field qualifier.
        function tokens(query) {
            var matches = query.match(/"[^"]*"|\S+/g) || [];
            return matches.map(function (s) { return s.replace(/^"|"$/g, '').toLowerCase(); }).filter(Boolean);
        }

        function applySearch() {
            var query = input.value.trim();
            // Preserve existing native searches, including empty/clear and
            // prefixed queries like ip:, user:, os:, wsc:, etc.
            if (!query || nativePrefixes.test(query)) {
                return nativeSearch.apply(this, arguments);
            }
            if (typeof nodes === 'undefined' || !nodes) {
                return nativeSearch.apply(this, arguments);
            }

            var terms = tokens(query);
            if (typeof putstore === 'function') putstore('_search', input.value);
            if (typeof QV === 'function') {
                QV('SearchInputClearButton', query.length > 0 && navigator.userAgent.indexOf('Firefox') >= 0);
            }

            // MeshCentral has used both arrays and id-keyed objects for nodes.
            Object.keys(nodes).forEach(function (id) {
                var node = nodes[id];
                if (!node || typeof node !== 'object') return;
                var haystack = searchableText(node);
                node.v = terms.every(function (term) { return haystack.indexOf(term) !== -1; });
            });

            // The native device list respects node.v and also applies its own
            // status/Online selector and permission-related display logic.
            if (typeof updateDevices === 'function') updateDevices();
            else if (typeof mainUpdate === 'function') mainUpdate(4);
        }
        applySearch._advancedsearchOriginal = nativeSearch;
        onSearchInputChanged = applySearch;

        input.title = 'Search device name, hostname, user, IP, group, tag, OS and description. All words must match. Existing MeshCentral prefix searches still work.';
        // In addition to the native onchange/keyup handlers, input catches
        // paste, cut, mobile keyboards, autofill and other non-keyup edits.
        input.addEventListener('input', function () {
            if (typeof mainUpdate === 'function') mainUpdate(5);
            else if (typeof masterUpdate === 'function') masterUpdate(5);
            else onSearchInputChanged();
        });
    };
    return plugin;
};
