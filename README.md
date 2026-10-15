# MeshCentral Advanced Search

A plugin that extends the search box on MeshCentral's **My Devices** page. Type what you're looking for and results update as you type. No prefixes needed.

## About

Searches device names, hostnames, users, IP addresses, groups, tags, operating systems and descriptions (where available). The existing Online filter and MeshCentral's built-in searches still work.

Examples:
- `osama` — matches that text in any supported field.
- `10.1.20.` — finds matching IP addresses.
- `osama windows` — both words must match, even across different fields.
- `"IT Support"` — matches the phrase.

## Install

Make sure plugins are enabled in MeshCentral's `config.json`, under `settings`:

```json
"plugins": {
  "enabled": true
}
```

Restart MeshCentral if you changed this setting.

1. Open **My Server → Plugins → Download Plugin**.
2. Paste this URL:

   ```text
   https://raw.githubusercontent.com/maxdorx/meshcentral-advancedsearch/main/config.json
   ```

3. Install and enable **Advanced Search (My Devices)**, then refresh the page.

## Updates

New versions show up in MeshCentral's Plugins page. Update there and refresh your browser.
