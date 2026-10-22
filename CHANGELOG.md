# Changelog

## 0.1.1
- Add release validation for MeshCentral's required plugin metadata.
- Verify the configured download uses GitHub's generated source archive and that nested archive files have explicit parent-directory entries.

## 0.1.0 (initial release)
- Search the existing My Devices filter across names, hostnames, assigned users, IP addresses, group names, tags, operating system and device descriptions, automatically and without prefixes.
- Case-insensitive substring matching; separate words use AND.
- Preserve native MeshCentral field-prefix searches, clear behaviour, and the existing status/Online selector.
- Browser-only plugin: no agent, database, external dependencies, or server endpoints.
