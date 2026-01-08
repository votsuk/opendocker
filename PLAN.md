# OpenDocker Release Strategy

## Overview

OpenDocker uses a **manual, GitHub Actions-based release workflow** for publishing official releases. This document outlines the complete release process from trigger to publication.

**Current State:**
- Distribution: npm registry + GitHub Releases with binaries
- Build: Single CLI package with multi-platform binaries
- Release Frequency: ~Weekly
- Release Permissions: Maintainer only (@votsuk-911)

---

## Release Workflow Architecture
### Workflow File Structure
```
.github/
  workflows/
    publish.yml          # Main release workflow
scripts/
  build.ts              # ✅ EXISTS - Multi-platform binary builder
  publish-start.ts      # ❌ TO CREATE - Version bump & changelog
  publish-complete.ts   # ❌ TO CREATE - Finalize release
  changelog.ts          # ❌ TO CREATE - AI-powered changelog generator
```

### Jobs Flow
```
publish-start (runs on: ubuntu-latest)
    ↓
publish-npm (runs on: ubuntu-latest, needs: publish-start)
    ↓
publish-binaries (runs on: ubuntu-latest, needs: publish-npm)
    ↓
publish-release (runs on: ubuntu-latest, needs: publish-binaries)
```

---

## Release Process - Step by Step

### 1️⃣ Manual Trigger
**Location:** GitHub Actions UI → `publish.yml` → "Run workflow"

**Inputs:**
- `bump_type`: Dropdown - `major` | `minor` | `patch`
- `version_override`: (Optional) Manual version string (e.g., "1.0.0")

**Implementation:**
```yaml
on:
  workflow_dispatch:
    inputs:
      bump_type:
        description: 'Version bump type'
        required: true
        type: choice
        options:
          - patch
          - minor
          - major
      version_override:
        description: 'Override version (optional, e.g., 1.0.0)'
        required: false
        type: string
```

---

### 2️⃣ Version Calculation
**Script:** `scripts/publish-start.ts`

**Process:**
1. Fetch current version from npm registry
   ```bash
   npm view opendocker version
   ```
2. If `version_override` provided → use it
3. Otherwise, bump according to `bump_type`:
   - `patch`: 0.2.0 → 0.2.1
   - `minor`: 0.2.0 → 0.3.0
   - `major`: 0.2.0 → 1.0.0

**Implementation:**
```typescript
const currentVersion = await $`npm view opendocker version`.text().trim()
const override = process.env.VERSION_OVERRIDE
const bumpType = process.env.BUMP_TYPE as 'major' | 'minor' | 'patch'

const newVersion = override || bumpVersion(currentVersion, bumpType)
```

**File:** `scripts/publish-start.ts:15-30`

---

### 3️⃣ AI-Powered Changelog Generation
**Script:** `scripts/changelog.ts`

**Process:**
1. Get git commits since last release tag
   ```bash
   git log $(git describe --tags --abbrev=0)..HEAD --oneline
   ```
2. For each commit, use OpenCode + Claude to:
   - Summarize the change (what & why)
   - Categorize (feat/fix/chore/docs)
   - Extract key details
3. Group commits by category
4. Format as markdown with commit SHAs
5. Add contributor attributions from git log

**Example Output:**
```markdown
## What's New

### Features
- Improved stability and performance of the TUI (432e8fb)
- Added shimmer text component (a8cfbc4)
- Updated Pane component to accept optional title (af27afd)

### Fixes
- Stabilized docker containers polling (b135806)
- Fixed proper dependencies for useEffect to get latest state (6912487)

### Chores
- Updated OpenTUI to latest version (6c745f3)
- Updated install command from npm to bun (f97ad2c)

**Contributors:** @votsuk-911
```

**OpenCode Integration:**
```typescript
async function summarizeCommit(commit: string): Promise<string> {
  const result = await $`opencode --non-interactive "Summarize this git commit in one concise sentence (what & why): ${commit}"`
  return result.text().trim()
}
```

**Note:** For weekly releases with ~20-30 commits, this will make 20-30 API calls. With efficient prompts, this should complete in 1-2 minutes.

**File:** `scripts/changelog.ts`

---

### 4️⃣ Update Package Versions
**Script:** `scripts/publish-start.ts`

**Files to Update:**
- `package.json` → `"version": "X.Y.Z"`

**Implementation:**
```typescript
const pkg = await Bun.file('package.json').json()
pkg.version = newVersion
await Bun.write('package.json', JSON.stringify(pkg, null, 2) + '\n')
```

**File:** `scripts/publish-start.ts:32-38`

---

### 5️⃣ Build & Publish to npm
**Script:** Leverages existing `scripts/build.ts`

**Process:**
1. Clean previous builds
   ```bash
   rm -rf dist bin
   ```
2. Build all platform binaries
   ```bash
   bun run build
   ```
   - Generates 11 platform-specific builds (see `scripts/build.ts:20-77`)
   - Creates dist structure with package.json for each platform
3. Publish main package to npm
   ```bash
   npm publish --access public
   ```
4. Publish platform-specific packages
   ```bash
   for dir in dist/opendocker-*; do
     cd $dir && npm publish --access public && cd ../..
   done
   ```

**npm Tags:**
- Official releases → `latest` tag
- Version is already in package.json from step 4

**Job:** `publish-npm` in `.github/workflows/publish.yml`

---

### 6️⃣ Create Git Artifacts
**Script:** `scripts/publish-start.ts`

**Process:**
1. Stage version changes
   ```bash
   git add package.json CHANGELOG.md
   ```
2. Commit with standardized message
   ```bash
   git commit -m "release: v${newVersion}"
   ```
3. Create annotated git tag
   ```bash
   git tag -a "v${newVersion}" -m "Release v${newVersion}"
   ```
4. Push commit and tag
   ```bash
   git push origin main
   git push origin "v${newVersion}"
   ```

**Git Config:**
```yaml
- name: Configure git
  run: |
    git config user.name "github-actions[bot]"
    git config user.email "github-actions[bot]@users.noreply.github.com"
```

**File:** `scripts/publish-start.ts:40-48`

---

### 7️⃣ Create Draft GitHub Release
**Script:** `scripts/publish-start.ts`

**Process:**
1. Create draft release with tag
   ```bash
   gh release create "v${newVersion}" \
     --draft \
     --title "OpenDocker v${newVersion}" \
     --notes-file CHANGELOG.md
   ```
2. CHANGELOG.md contains AI-generated notes from step 3

**Output:** Draft release visible at:
`https://github.com/votsuk-911/opendocker/releases/tag/v${newVersion}`

**File:** `scripts/publish-start.ts:50-52`

---

### 8️⃣ Attach Binaries to Release
**Job:** `publish-binaries` in workflow

**Process:**
1. All binaries already built in dist/ from step 5
2. Upload each platform binary to draft release
   ```bash
   gh release upload "v${newVersion}" \
     dist/opendocker-darwin-arm64/bin/opendocker \
     dist/opendocker-darwin-x64/bin/opendocker \
     dist/opendocker-darwin-x64-baseline/bin/opendocker \
     dist/opendocker-linux-arm64/bin/opendocker \
     dist/opendocker-linux-arm64-musl/bin/opendocker \
     dist/opendocker-linux-x64/bin/opendocker \
     dist/opendocker-linux-x64-baseline/bin/opendocker \
     dist/opendocker-linux-x64-baseline-musl/bin/opendocker \
     dist/opendocker-linux-x64-musl/bin/opendocker \
     dist/opendocker-windows-x64/bin/opendocker.exe \
     dist/opendocker-windows-x64-baseline/bin/opendocker.exe
   ```

**Binary Naming:**
- Keep original structure: `opendocker-{platform}-{arch}[-variant]`
- Users download specific binary for their platform

**Job:** `publish-binaries` in `.github/workflows/publish.yml`

---

### 9️⃣ Publish Release
**Script:** `scripts/publish-complete.ts`

**Process:**
1. Mark release as published (remove draft status)
   ```bash
   gh release edit "v${newVersion}" --draft=false
   ```
2. Release is now live at:
   - npm: `npm install -g opendocker@${newVersion}`
   - GitHub: `https://github.com/votsuk-911/opendocker/releases/tag/v${newVersion}`

**Post-Release:**
- GitHub automatically notifies watchers
- npm registry updates within seconds
- Binaries available for direct download

**Job:** `publish-release` in `.github/workflows/publish.yml`

---

## Prerequisites & Setup

### Required GitHub Secrets
```
NPM_TOKEN              # npm authentication token (already in .npmrc locally)
ANTHROPIC_API_KEY      # For AI changelog generation via OpenCode
GITHUB_TOKEN           # Auto-provided by GitHub Actions
```

**Setup Instructions:**
1. Go to repository Settings → Secrets and variables → Actions
2. Add `NPM_TOKEN`: Copy token from `.npmrc` (line 1, after `:_authToken=`)
3. Add `ANTHROPIC_API_KEY`: Get from https://console.anthropic.com

### Required Permissions
```yaml
permissions:
  contents: write      # For creating tags, releases, and pushing commits
  packages: write      # For npm publishing (if using GitHub Packages)
```

### GitHub Branch Protection (Optional)
To restrict who can trigger the workflow:
1. Go to Settings → Branches → Add rule for `main`
2. Enable "Require deployments" for Actions environments
3. Create environment named "production" 
4. Add yourself as required reviewer

### Local Setup (for testing)
```bash
# Ensure opencode is installed
which opencode  # ✅ Already installed: /Users/stevenkustov/.bun/bin/opencode

# Ensure gh CLI is installed
which gh
gh auth status

# Test build process
bun run build

# Test version bump logic (when script exists)
BUMP_TYPE=patch bun run scripts/publish-start.ts --dry-run
```

---

## File Implementations

### 1. `.github/workflows/publish.yml`
```yaml
name: Publish Release

on:
  workflow_dispatch:
    inputs:
      bump_type:
        description: 'Version bump type'
        required: true
        type: choice
        default: 'patch'
        options:
          - patch
          - minor
          - major
      version_override:
        description: 'Override version (optional, e.g., 1.0.0)'
        required: false
        type: string

permissions:
  contents: write

jobs:
  publish-start:
    runs-on: ubuntu-latest
    outputs:
      version: ${{ steps.version.outputs.version }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Full history for changelog
      
      - uses: oven-sh/setup-bun@v2
      
      - name: Install dependencies
        run: bun install
      
      - name: Configure git
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
      
      - name: Setup OpenCode
        run: |
          curl -fsSL https://install.opencode.ai/install.sh | sh
          export PATH="$HOME/.bun/bin:$PATH"
          opencode --version
      
      - name: Run publish-start
        env:
          BUMP_TYPE: ${{ inputs.bump_type }}
          VERSION_OVERRIDE: ${{ inputs.version_override }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: bun run scripts/publish-start.ts
      
      - name: Output version
        id: version
        run: echo "version=$(node -p "require('./package.json').version")" >> $GITHUB_OUTPUT

  publish-npm:
    runs-on: ubuntu-latest
    needs: publish-start
    steps:
      - uses: actions/checkout@v4
        with:
          ref: main  # Get latest commit with version bump
      
      - uses: oven-sh/setup-bun@v2
      
      - name: Install dependencies
        run: bun install
      
      - name: Build all platforms
        run: bun run build
      
      - name: Publish to npm
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
        run: |
          echo "//registry.npmjs.org/:_authToken=${NODE_AUTH_TOKEN}" > .npmrc
          npm publish --access public
          
          # Publish platform-specific packages
          for dir in dist/opendocker-*; do
            cd "$dir"
            npm publish --access public
            cd ../..
          done

  publish-binaries:
    runs-on: ubuntu-latest
    needs: publish-npm
    steps:
      - uses: actions/checkout@v4
        with:
          ref: main
      
      - uses: oven-sh/setup-bun@v2
      
      - name: Install dependencies
        run: bun install
      
      - name: Build binaries
        run: bun run build
      
      - name: Upload binaries to release
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          VERSION="v${{ needs.publish-start.outputs.version }}"
          
          gh release upload "$VERSION" \
            dist/opendocker-darwin-arm64/bin/opendocker \
            dist/opendocker-darwin-x64/bin/opendocker \
            dist/opendocker-darwin-x64-baseline/bin/opendocker \
            dist/opendocker-linux-arm64/bin/opendocker \
            dist/opendocker-linux-arm64-musl/bin/opendocker \
            dist/opendocker-linux-x64/bin/opendocker \
            dist/opendocker-linux-x64-baseline/bin/opendocker \
            dist/opendocker-linux-x64-baseline-musl/bin/opendocker \
            dist/opendocker-linux-x64-musl/bin/opendocker \
            dist/opendocker-windows-x64/bin/opendocker.exe \
            dist/opendocker-windows-x64-baseline/bin/opendocker.exe

  publish-release:
    runs-on: ubuntu-latest
    needs: [publish-start, publish-binaries]
    steps:
      - uses: actions/checkout@v4
        with:
          ref: main
      
      - uses: oven-sh/setup-bun@v2
      
      - name: Install dependencies
        run: bun install
      
      - name: Publish release
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: bun run scripts/publish-complete.ts
```

### 2. `scripts/publish-start.ts`
```typescript
#!/usr/bin/env bun

import { $ } from "bun"
import path from "path"

const dir = process.cwd()
process.chdir(dir)

console.log("🚀 Starting release process...\n")

// 1. Calculate new version
console.log("📊 Calculating version...")
const currentVersion = (await $`npm view opendocker version`.text()).trim()
const override = process.env.VERSION_OVERRIDE?.trim()
const bumpType = process.env.BUMP_TYPE as 'major' | 'minor' | 'patch'

function bumpVersion(version: string, type: 'major' | 'minor' | 'patch'): string {
  const [major, minor, patch] = version.split('.').map(Number)
  switch (type) {
    case 'major': return `${major + 1}.0.0`
    case 'minor': return `${major}.${minor + 1}.0`
    case 'patch': return `${major}.${minor}.${patch + 1}`
  }
}

const newVersion = override || bumpVersion(currentVersion, bumpType)
console.log(`📦 Version: ${currentVersion} → ${newVersion}\n`)

// 2. Generate changelog
console.log("📝 Generating AI-powered changelog...")
const { generateChangelog } = await import("./changelog.ts")
const changelog = await generateChangelog(newVersion)
await Bun.write("CHANGELOG.md", changelog)
console.log("✅ Changelog generated\n")

// 3. Update package.json
console.log("📝 Updating package.json...")
const pkgPath = path.join(dir, "package.json")
const pkg = await Bun.file(pkgPath).json()
pkg.version = newVersion
await Bun.write(pkgPath, JSON.stringify(pkg, null, 2) + "\n")
console.log(`✅ Version updated: ${newVersion}\n`)

// 4. Create git commit and tag
console.log("🏷️  Creating git commit and tag...")
await $`git add package.json CHANGELOG.md`
await $`git commit -m "release: v${newVersion}"`
await $`git tag -a "v${newVersion}" -m "Release v${newVersion}"`
await $`git push origin main`
await $`git push origin "v${newVersion}"`
console.log("✅ Git artifacts created\n")

// 5. Create draft GitHub release
console.log("📦 Creating draft GitHub release...")
await $`gh release create "v${newVersion}" --draft --title "OpenDocker v${newVersion}" --notes-file CHANGELOG.md`
console.log("✅ Draft release created\n")

console.log(`🎉 Release preparation complete!`)
console.log(`   Version: ${newVersion}`)
console.log(`   Tag: v${newVersion}`)
console.log(`   Status: Draft release created`)
```

### 3. `scripts/publish-complete.ts`
```typescript
#!/usr/bin/env bun

import { $ } from "bun"
import pkg from "../package.json"

const version = `v${pkg.version}`

console.log(`\n📦 Publishing release ${version}...`)

// Mark release as published (remove draft status)
await $`gh release edit "${version}" --draft=false`

console.log(`\n✅ Release ${version} published successfully!`)
console.log(`\n📦 Installation:`)
console.log(`   npm: npm install -g opendocker@${pkg.version}`)
console.log(`\n🔗 Links:`)
console.log(`   GitHub: https://github.com/votsuk-911/opendocker/releases/tag/${version}`)
console.log(`   npm: https://www.npmjs.com/package/opendocker`)
```

### 4. `scripts/changelog.ts`
```typescript
#!/usr/bin/env bun

import { $ } from "bun"

interface Commit {
  sha: string
  message: string
  author: string
}

async function getCommits(since?: string): Promise<Commit[]> {
  try {
    const sinceTag = since || (await $`git describe --tags --abbrev=0`.text()).trim()
    const log = await $`git log ${sinceTag}..HEAD --pretty=format:%H|%s|%an`.text()
    
    if (!log.trim()) {
      return []
    }

    return log
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [sha, message, author] = line.split("|")
        return { sha: sha.slice(0, 7), message, author }
      })
  } catch (error) {
    // No previous tags exist
    console.log("⚠️  No previous tags found, using all commits")
    const log = await $`git log --pretty=format:%H|%s|%an`.text()
    
    return log
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [sha, message, author] = line.split("|")
        return { sha: sha.slice(0, 7), message, author }
      })
  }
}

async function summarizeCommit(commit: Commit): Promise<string> {
  try {
    const prompt = `Summarize this git commit in one concise sentence focusing on what changed and why. Be specific and technical. Do not use markdown formatting. Commit: ${commit.message}`
    
    // Use OpenCode CLI to generate summary
    const result = await $`opencode --non-interactive ${prompt}`.text()
    return result.trim()
  } catch (error) {
    // Fallback to original message if OpenCode fails
    console.warn(`⚠️  OpenCode summarization failed for ${commit.sha}, using original message`)
    return commit.message
  }
}

function categorizeCommit(message: string): string {
  const lower = message.toLowerCase()
  if (lower.startsWith("feat:") || lower.startsWith("feat(") || lower.includes("add") || lower.includes("implement")) {
    return "Features"
  }
  if (lower.startsWith("fix:") || lower.startsWith("fix(") || lower.includes("fix") || lower.includes("resolve")) {
    return "Fixes"
  }
  if (lower.startsWith("docs:") || lower.startsWith("docs(") || lower.includes("documentation")) {
    return "Documentation"
  }
  if (lower.startsWith("chore:") || lower.startsWith("chore(") || lower.includes("update") || lower.includes("bump")) {
    return "Chores"
  }
  if (lower.startsWith("refactor:") || lower.startsWith("refactor(")) {
    return "Refactoring"
  }
  if (lower.startsWith("perf:") || lower.startsWith("perf(") || lower.includes("performance")) {
    return "Performance"
  }
  return "Other"
}

export async function generateChangelog(version: string): Promise<string> {
  console.log("📝 Fetching commits since last release...")
  const commits = await getCommits()
  
  if (commits.length === 0) {
    return `# Release v${version}\n\nNo changes since last release.`
  }

  console.log(`📝 Found ${commits.length} commits, generating AI summaries...`)
  
  // Categorize and summarize commits
  const categorized: Record<string, Array<{ summary: string; sha: string }>> = {}
  
  for (const commit of commits) {
    const summary = await summarizeCommit(commit)
    const category = categorizeCommit(commit.message)
    
    if (!categorized[category]) {
      categorized[category] = []
    }
    
    categorized[category].push({ summary, sha: commit.sha })
  }

  // Build changelog
  let changelog = `# Release v${version}\n\n`
  changelog += `## What's New\n\n`

  // Sort categories by priority
  const categoryOrder = ["Features", "Fixes", "Performance", "Refactoring", "Documentation", "Chores", "Other"]
  
  for (const category of categoryOrder) {
    if (categorized[category] && categorized[category].length > 0) {
      changelog += `### ${category}\n\n`
      for (const { summary, sha } of categorized[category]) {
        changelog += `- ${summary} (${sha})\n`
      }
      changelog += `\n`
    }
  }

  // Add contributors
  const contributors = [...new Set(commits.map((c) => c.author))]
  if (contributors.length > 0) {
    changelog += `## Contributors\n\n`
    changelog += contributors.map((name) => `- ${name}`).join("\n")
    changelog += `\n`
  }

  return changelog
}

// Allow running standalone for testing
if (import.meta.main) {
  const version = process.argv[2] || "next"
  const changelog = await generateChangelog(version)
  console.log("\n" + changelog)
}
```

---

## Testing Strategy

### Pre-Release Checklist
```bash
# 1. Test local build
bun run build
./bin/opendocker  # Verify binary works

# 2. Test changelog generation (once script exists)
bun run scripts/changelog.ts test-version

# 3. Verify npm authentication
npm whoami
# Should output your npm username

# 4. Test gh CLI
gh auth status
gh release list --repo votsuk-911/opendocker

# 5. Verify OpenCode
opencode --version
echo "test prompt" | opencode --non-interactive
```

### Dry Run Testing
Before first production release, test each script individually:

```bash
# Test version calculation
BUMP_TYPE=patch VERSION_OVERRIDE="" node -e "console.log('0.3.0' -> bump -> '0.3.1')"

# Test changelog generation
bun run scripts/changelog.ts 0.4.0-test

# Test git operations (on test branch)
git checkout -b test-release
# ... run publish-start.ts
git checkout main
git branch -D test-release
```

---

## Rollback Strategy

### If Release Fails Mid-Process

**Scenario 1: Before npm publish**
```bash
# Delete local tag
git tag -d v0.4.0

# Delete remote tag  
git push --delete origin v0.4.0

# Revert version commit
git reset --hard HEAD~1
git push --force origin main

# Delete draft release
gh release delete v0.4.0 --yes
```

**Scenario 2: After npm publish, before making release public**
```bash
# Deprecate npm version (cannot unpublish after 72h)
npm deprecate opendocker@0.4.0 "Release failed, please use @0.3.0"

# Delete draft release
gh release delete v0.4.0 --yes

# Keep git tag for history, or delete if preferred
```

**Scenario 3: After full release publication**
- **DO NOT unpublish from npm** (breaks downstream users)
- Create hotfix release with next patch version
- Add note to release: "Please upgrade to v0.4.1 due to issues in v0.4.0"
- Deprecate problematic version: `npm deprecate opendocker@0.4.0 "Use @0.4.1 instead"`

---

## Timeline & Performance

### Expected Duration
- **Manual trigger:** 5 seconds
- **publish-start job:** 2-4 minutes
  - Version calculation: 5s
  - Changelog generation: 1-3min (20-30 commits × 3-5s each)
  - Git operations: 10s
  - Draft release creation: 5s
- **publish-npm job:** 8-12 minutes
  - Dependencies: 30s
  - Build all platforms: 6-10min
  - Publish to npm: 1-2min
- **publish-binaries job:** 1-2 minutes
  - Build: reuses artifacts
  - Upload: 1-2min (11 binaries)
- **publish-release job:** 10 seconds

**Total: ~12-20 minutes** for complete release

### Optimization Opportunities
- Cache bun dependencies between jobs (save 30s per job)
- Parallelize platform builds (reduce build time by 50%)
- Batch OpenCode API calls (reduce changelog time by 60%)

---

## Troubleshooting Guide

### Common Issues

**Issue: "npm publish failed - 403 Forbidden"**
```bash
# Verify NPM_TOKEN in GitHub Secrets is correct
# Test locally:
npm whoami
npm publish --dry-run
```

**Issue: "OpenCode command not found in CI"**
```bash
# Ensure PATH is exported after installation
export PATH="$HOME/.bun/bin:$PATH"
opencode --version
```

**Issue: "gh: command not found"**
```bash
# gh CLI is pre-installed on ubuntu-latest runners
# If missing, add setup step:
- uses: cli/gh-cli/actions/setup-gh@v1
```

**Issue: "Binary build fails for specific platform"**
```bash
# Check Bun version compatibility
bun --version  # Should be 1.3.2+

# Test single platform build
bun run scripts/build.ts --single

# Check build logs for missing dependencies
```

**Issue: "Changelog generation is slow (>5 minutes)"**
```bash
# Reduce number of commits by releasing more frequently
# Or add batching: summarize 5 commits at once instead of 1 at a time
```

**Issue: "Git push failed - protected branch"**
```bash
# Ensure github-actions[bot] has write permissions
# Check Settings → Actions → General → Workflow permissions
# Select "Read and write permissions"
```

**Issue: "Version already exists on npm"**
```bash
# If re-running workflow after partial failure:
# 1. Delete the git tag first
# 2. Revert version commit
# 3. Re-run workflow with fresh version
```

---

## Maintenance

### Regular Tasks
- [ ] **Monthly:** Update GitHub Actions to latest versions
  ```yaml
  actions/checkout@v4 → v5
  oven-sh/setup-bun@v2 → v3
  ```
- [ ] **Monthly:** Update Bun to latest stable
  ```bash
  bun upgrade
  ```
- [ ] **Quarterly:** Review and optimize changelog prompts
- [ ] **Quarterly:** Clean up old draft releases (if any failed releases)
- [ ] **As Needed:** Monitor npm download statistics
  ```bash
  npm info opendocker
  ```

### Version Strategy
- **Patch (0.X.Y)**: Bug fixes, small improvements, dependency updates
- **Minor (0.Y.0)**: New features, non-breaking changes, UI improvements
- **Major (X.0.0)**: Breaking changes, major refactors, API changes

**Current Phase:** v0.3.0 (pre-1.0)
- Breaking changes allowed in minor versions
- Focus on stability and feature completeness

**Target:** v1.0.0 when:
- Core features are stable
- API is finalized
- Documentation is complete
- User feedback is incorporated

---

## Security Considerations

### Secrets Management
- **NPM_TOKEN**: Has full publish access to npm package
  - Rotate every 6 months
  - Use automation tokens (not user tokens)
  - Never commit to git
  
- **ANTHROPIC_API_KEY**: Has access to Claude API
  - Monitor usage at https://console.anthropic.com
  - Set spending limits to prevent abuse
  
- **GITHUB_TOKEN**: Auto-provided by GitHub
  - Scoped to repository only
  - Automatically rotated

### Workflow Security
- Workflow can only be triggered manually (no automatic triggers)
- Only repository collaborators can trigger workflows
- Consider adding environment protection for additional approval step

### Dependency Security
```bash
# Regularly audit dependencies
bun audit

# Update vulnerable dependencies
bun update
```

---

## Success Criteria

A successful release should:
- ✅ Complete in under 20 minutes
- ✅ Require zero manual intervention after trigger
- ✅ Generate accurate, AI-powered changelog with meaningful summaries
- ✅ Publish main package + 11 platform-specific packages to npm
- ✅ Create GitHub release with all 11 downloadable binaries
- ✅ Update git tags and commit history automatically
- ✅ Be idempotent (safe to re-run if it fails mid-process)
- ✅ Provide clear progress logs and error messages
- ✅ Support rollback if needed
- ✅ Maintain version consistency across all artifacts

**Definition of Done:**
1. `npm install -g opendocker@latest` installs the new version
2. GitHub release shows the new version with binaries attached
3. Git tag `vX.Y.Z` exists and points to release commit
4. Changelog is accurate and well-formatted
5. All 11 platform binaries are downloadable and functional

---

## Implementation Checklist

### Phase 1: Initial Setup (Est. 2 hours)
- [ ] Create `.github/workflows/` directory
- [ ] Create `.github/workflows/publish.yml`
- [ ] Create `scripts/publish-start.ts`
- [ ] Create `scripts/publish-complete.ts`
- [ ] Create `scripts/changelog.ts`
- [ ] Add execute permissions to scripts
  ```bash
  chmod +x scripts/publish-*.ts scripts/changelog.ts
  ```

### Phase 2: GitHub Configuration (Est. 30 minutes)
- [ ] Add `ANTHROPIC_API_KEY` to GitHub Secrets
  1. Go to https://github.com/votsuk-911/opendocker/settings/secrets/actions
  2. Click "New repository secret"
  3. Name: `ANTHROPIC_API_KEY`
  4. Value: Your API key from https://console.anthropic.com
  
- [ ] Add `NPM_TOKEN` to GitHub Secrets
  1. Get token from `.npmrc` (line 1)
  2. Or create new token at https://www.npmjs.com/settings/~/tokens
  3. Add as secret named `NPM_TOKEN`
  
- [ ] Configure Actions permissions
  1. Go to Settings → Actions → General
  2. Workflow permissions → "Read and write permissions"
  3. Save

### Phase 3: Testing (Est. 1 hour)
- [ ] Test changelog generation locally
  ```bash
  bun run scripts/changelog.ts test-version
  ```
- [ ] Test build process
  ```bash
  bun run build
  ./bin/opendocker
  ```
- [ ] Verify gh CLI authentication
  ```bash
  gh auth status
  gh release list
  ```
- [ ] Verify OpenCode works
  ```bash
  echo "test" | opencode --non-interactive
  ```

### Phase 4: Dry Run (Est. 30 minutes)
- [ ] Create test branch
  ```bash
  git checkout -b test-release
  ```
- [ ] Manually run publish-start.ts with dry-run flag (add flag to script)
- [ ] Verify outputs without actually publishing
- [ ] Clean up test artifacts
  ```bash
  git checkout main
  git branch -D test-release
  ```

### Phase 5: First Production Release (Est. 1 hour)
- [ ] Trigger workflow from GitHub Actions UI
- [ ] Monitor each job's progress
- [ ] Verify npm publication
  ```bash
  npm info opendocker
  ```
- [ ] Verify GitHub release
  ```bash
  gh release view v0.4.0
  ```
- [ ] Test installation
  ```bash
  npm install -g opendocker@latest
  opendocker --version
  ```
- [ ] Download and test a binary from GitHub Releases

### Phase 6: Documentation (Est. 30 minutes)
- [ ] Update README.md with installation instructions
- [ ] Document release process for future reference
- [ ] Add troubleshooting notes for common issues

---

## Next Steps

1. **Review this plan** - Ensure all requirements are met
2. **Ask questions** - Clarify any unclear sections
3. **Approve implementation** - Give go-ahead to create files
4. **Execute Phase 1** - Create workflow and scripts
5. **Execute Phase 2** - Configure GitHub secrets
6. **Execute Phase 3-4** - Test thoroughly
7. **Execute Phase 5** - First production release (v0.4.0)
8. **Iterate** - Improve based on experience

---

**Status:** 📋 Planning Complete - Ready for Implementation  
**Created:** 2026-01-07  
**Last Updated:** 2026-01-07  
**Owner:** @votsuk-911  
**Next Action:** Review plan and approve for implementation
