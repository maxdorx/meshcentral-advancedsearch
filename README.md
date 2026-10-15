# MeshCentral Advanced Search

Small, browser-only plugin for MeshCentral's **My Devices** filter. It replaces no controls, adds no additional search box and requires no search syntax.

Typing `osama` in the existing Filter field immediately shows the devices whose *available* name, hostname, assigned user, IP, device group, tags, OS or description contains `osama` (case-insensitive). It works on every input change, including paste. `osama laptop` requires both words somewhere in those fields; `"IT support"` searches a literal phrase.

The normal **Online** / other status selector still runs in the native device-list renderer. Native prefixed filters such as `user:`, `ip:`, `group:`, `tag:`, `os:`, `desc:`, `atag:`, `amt:` and `wsc:` are delegated unchanged to MeshCentral. Empty search is also delegated unchanged.

The plugin never reaches out to endpoints or searches records the logged-in user has not received from MeshCentral. Missing fields cannot match. It does not implement server-side search or modify access permissions.

## Install from GitHub

1. Back up `meshcentral-data/config.json`.
2. Add or merge `"plugins": { "enabled": true }` inside `settings`, then restart MeshCentral if this changes the setting.
3. As a full administrator, visit **My Server → Plugins → Download plugin**.
4. Paste the raw config URL:
   `https://raw.githubusercontent.com/maxdorx/meshcentral-advancedsearch/main/config.json`
5. Enable the plugin and reload the browser page. Search normally in **My Devices → Filter**.

The repository must be publicly accessible for GitHub's raw configuration and archive URLs to be usable without credentials.

## Built-in update checks

MeshCentral's Plugins page checks the `configUrl` above for newer versions. When the `version` in `config.json` is incremented using semantic versioning (for example from `0.1.0` to `0.1.1`) and committed to `main`, the Plugins UI can report the update and install the current GitHub archive via `downloadUrl`. Updates are offered by MeshCentral; this plugin does **not** silently auto-install them. Reload the browser after an update so the newly exported web UI hook runs.

For each release, update `config.json` and `CHANGELOG.md`, commit the files to `main`, and create/push a matching tag (for example `v0.1.1`). The `versionHistoryUrl` points to GitHub's tags endpoint so MeshCentral can list older tagged versions. The first version has no older versions yet. **Do not change `shortName` or `configUrl` across releases:** installed plugins use those values to locate this plugin and check for new versions.

The GitHub archive contains one outer `meshcentral-advancedsearch-main/` directory. MeshCentral's plugin installer removes that directory and expects `advancedsearch.js` and `config.json` at the archive root.

## Local installation / development

Place these files in `meshcentral-data/plugins/advancedsearch/` and, inside your `settings` config, add `"plugins": { "enabled": true, "list": ["advancedsearch"] }`. Merge existing plugin names in `list` instead of replacing them. Restart MeshCentral and hard-refresh your browser. For managed installations, prefer the UI method above rather than switching to local-list mode.

## Compatibility and limitations

MeshCentral documents the `onWebUIStartupEnd` hook, but provides no official hook for replacing the filter predicate. The plugin wraps the internal `onSearchInputChanged()` client function, uses the delivered `nodes` and `meshes`, writes the existing `node.v` flags, and asks the normal `updateDevices()` renderer to refresh. These are internal implementation details: test against your deployed MeshCentral version after upgrades. It has been syntax-checked and tested with a simulated MeshCentral browser environment but **has not been tested against your actual instance**. If an update breaks it, disable the plugin and hard-refresh to restore native filtering.

## Security

Browser-only and self-contained. No third-party JS, tracking, backend API endpoints, agent modules, or database writes. This plugin does not broaden server-provided device access; it only searches the existing client-side node data.

## Source references

- [MeshCentral plugin development and installation](https://docs.meshcentral.com/meshcentral/plugins/)
- [MeshCentral plugin loader](https://github.com/Ylianst/MeshCentral/blob/master/pluginHandler.js)
- [MeshCentral My Devices frontend](https://github.com/Ylianst/MeshCentral/blob/master/views/default.handlebars)
