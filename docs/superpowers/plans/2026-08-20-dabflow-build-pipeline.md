# DabFlow 2.0 — Build Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single-APK GitHub Actions workflow with a 3-variant parallel pipeline that builds `free`, `demo`, and `premium` APKs and attaches all three to a single GitHub Release.

**Architecture:** Single workflow file with a matrix strategy across 3 variants. Each matrix job: injects `BUILD_VARIANT` into `www/index.html`, runs Capacitor sync, builds a debug APK with Gradle, renames the APK, uploads to a shared release. The release is created once before the matrix jobs run, using a `setup` job that outputs the upload URL.

**Tech Stack:** GitHub Actions, Capacitor CLI 6.x, Gradle (Android), `actions/create-release@v1`, `actions/upload-release-asset@v1`.

**Spec:** `docs/superpowers/specs/2026-08-20-dabflow-redesign-design.md`

**Depends on:** App Core plan must be complete — `www/` files must exist before this pipeline can sync them into Android.

## Global Constraints

- Three APK names: `DabFlow-free.apk`, `DabFlow-demo.apk`, `DabFlow-premium.apk`
- All three attached to the same GitHub Release, tagged `v2.0.0-<run_number>`
- `BUILD_VARIANT` injected by sed into `www/index.html` before `npx cap sync`
- Release created in a `setup` job; matrix jobs receive `upload_url` via job output
- `permissions: contents: write` required at workflow level
- No artifact retention — APKs live on the Release only (no `upload-artifact` step)
- Debug builds only for now (no signing secrets needed)

---

## File Map

| File | Change |
|------|--------|
| `.github/workflows/build.yml` | Full rewrite — setup job + 3-variant matrix |

---

### Task 1: Rewrite GitHub Actions Workflow

**Files:**
- Modify: `.github/workflows/build.yml`

**Interfaces:**
- Produces: `setup` job outputs `upload_url` consumed by `build-apk` matrix jobs
- Matrix variable `variant` takes values `free`, `demo`, `premium`

- [ ] **Step 1: Write the new workflow**

```yaml
name: Build Android APKs

on:
  push:
    branches: [main, master]
  workflow_dispatch:

permissions:
  contents: write

jobs:

  # ── Create the release once, share upload_url with matrix jobs ──
  setup:
    name: Create Release
    runs-on: ubuntu-latest
    outputs:
      upload_url: ${{ steps.create_release.outputs.upload_url }}
      version: ${{ steps.version.outputs.VERSION }}

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Get version
        id: version
        run: echo "VERSION=$(node -p "require('./package.json').version")" >> $GITHUB_OUTPUT

      - name: Create GitHub Release
        id: create_release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: v${{ steps.version.outputs.VERSION }}-${{ github.run_number }}
          release_name: DabFlow v${{ steps.version.outputs.VERSION }} (build ${{ github.run_number }})
          body: |
            Ember UI — 3 APK variants

            - **DabFlow-free.apk** — Mantis ads, fresh install (no demo data)
            - **DabFlow-demo.apk** — Mantis ads, 100 sessions pre-seeded
            - **DabFlow-premium.apk** — No ads, 100 sessions pre-seeded
          draft: false
          prerelease: false

  # ── Build each variant in parallel ──
  build-apk:
    name: Build ${{ matrix.variant }} APK
    needs: setup
    runs-on: ubuntu-latest

    strategy:
      matrix:
        variant: [free, demo, premium]

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup JDK 17
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Install dependencies
        run: npm install

      - name: Inject BUILD_VARIANT into index.html
        env:
          VARIANT: ${{ matrix.variant }}
        run: |
          sed -i "s/window\.BUILD_VARIANT = '[^']*'/window.BUILD_VARIANT = '$VARIANT'/" www/index.html
          echo "Injected BUILD_VARIANT=$VARIANT"
          grep "BUILD_VARIANT" www/index.html

      - name: Add Capacitor Android platform
        run: npx cap add android

      - name: Sync web assets to Android
        run: npx cap sync android

      - name: Make gradlew executable
        run: chmod +x android/gradlew

      - name: Build debug APK
        working-directory: android
        run: ./gradlew assembleDebug

      - name: Upload APK to Release
        uses: actions/upload-release-asset@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          upload_url: ${{ needs.setup.outputs.upload_url }}
          asset_path: android/app/build/outputs/apk/debug/app-debug.apk
          asset_name: DabFlow-${{ matrix.variant }}.apk
          asset_content_type: application/vnd.android.package-archive
```

- [ ] **Step 2: Verify `index.html` has the injectable line**

The line in `www/index.html` must be exactly:
```html
<script>window.BUILD_VARIANT = 'free';</script>
```
The `sed` command matches `window.BUILD_VARIANT = '[^']*'` — confirm this pattern is present after Task 1 of the App Core plan.

- [ ] **Step 3: Commit and push**

```bash
git add .github/workflows/build.yml
git commit -m "feat: 3-variant parallel APK build pipeline

setup job creates Release, matrix jobs build free/demo/premium in parallel
and upload each APK as a named release asset.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
git push origin main
```

- [ ] **Step 4: Verify the run**

Watch `github.com/twoskoops707/DabFlow-Redesign/actions` — you should see:
  - 1 `setup` job creates the release
  - 3 parallel `build-apk` jobs (free, demo, premium)
  - All 3 complete and attach APKs to the release

Check `github.com/twoskoops707/DabFlow-Redesign/releases` — the release should have exactly 3 assets:
  - `DabFlow-free.apk`
  - `DabFlow-demo.apk`
  - `DabFlow-premium.apk`

- [ ] **Step 5: Download and sideload `DabFlow-demo.apk` to verify**

  - Install on device: `adb install DabFlow-demo.apk` or sideload via file manager
  - Launch — should show DabFlow 2.0 Ember UI
  - Navigate to Stats — charts should be populated (100 sessions)
  - Ads should be visible (Mantis banner in stats)
  - Install `DabFlow-premium.apk` — ads absent, achievements unlocked
