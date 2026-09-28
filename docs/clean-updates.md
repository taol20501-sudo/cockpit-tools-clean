# Clean edition updates

This document describes the fork-specific automation; upstream release instructions
do not override these Clean safeguards.

- `Sync Upstream` checks upstream main every three hours (GitHub schedules may be delayed).
- It merges upstream code, preserves the Clean application identity and updater
  public key, and runs `scripts/verify-clean-edition.cjs` before pushing.
- Known sponsor sections in the top-level READMEs and referral parameters in
  the APIKEY registration constant are normalized before a three-way merge.
  Upstream domain changes and ordinary documentation changes still merge.
  Disabled sponsor/advertisement stores remain Clean-owned. These rules replay
  the September 2026 conflicts in regression tests; unrelated conflicts still stop.
- All `gh` operations in the sync job use `GH_REPO: ${{ github.repository }}`.
  The release dispatch also explicitly passes that repository. Without this,
  GitHub CLI may resolve a fork to its parent, incorrectly inspect the original
  project's releases or try to dispatch its workflow.
- A release is complete only when its current manifest points to this Clean tag
  and all updater installers, signatures, target manifests and checksums exist.
  A matching version number alone is insufficient.
- An incomplete release triggers `Release` on Clean main unless main already
  has an active release run. The workflow builds and uploads installers;
  maintainers do not need to download, extract or re-upload upstream installers.
- Starting with v1.3.61, only Windows EXE/MSI and macOS packages are published.
  Linux packages and Linux updater entries are omitted; historical releases remain intact.
  Retain signatures, target manifests and checksums: they support secure automatic updates.
  Packages are built from Clean source using the existing repository signing secrets.
  Never commit or print the private signing key.
- Each Release ends with the original project attribution, unofficial modified
  edition notice and license information. Keep LICENSE and NOTICE intact.

## Recovery

1. Inspect the failed step under Actions → Sync Upstream or Release.
2. For a merge conflict, resolve it locally; port Clean changes when upstream moves
   a component to a new file. Never automatically accept all upstream changes.
3. Run the Clean guard, merge/release regression tests, frontend tests and build.
4. Push the validated merge to Clean main, then manually run Sync Upstream.
5. Wait for Release, Finalize Legacy Updater Manifest and Publish SHA256SUMS to
   succeed. A newly visible release may still be building. Expand all assets to
   find Windows `*_x64-setup.exe` (the `.exe.sig` file is not an installer).

The automation deliberately stops on conflicts or failed Clean safeguards.
That protects the no-ad edition; it cannot guarantee unattended merges after
every future upstream refactor.
