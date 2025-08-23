# Automatic Version Bumping with Conventional Commits

## ✅ Current Setup Status
Your project already has automatic version bumping fully configured with:
- **semantic-release** for automated versioning
- **conventional commits** with commitlint validation
- **GitHub Actions** CI/CD pipeline automation

## 🔄 How Automatic Version Bumping Works

### Version Bump Rules:
1. **`feat:`** commits → **MINOR** version bump (0.7.3 → 0.8.0)
2. **`fix:`** commits → **PATCH** version bump (0.7.3 → 0.7.4)
3. **`BREAKING CHANGE:`** or **`feat!:`** → **MAJOR** version bump (0.7.3 → 1.0.0)
4. **`chore:`**, **`docs:`**, **`style:`** → No version bump (unless forced)

### Example Conventional Commit Messages:
```bash
# Feature addition (minor bump)
git commit -m "feat: add support for Claude AI provider"

# Bug fix (patch bump)
git commit -m "fix: resolve memory leak in code analysis"

# Breaking change (major bump)
git commit -m "feat!: redesign API with new authentication method"

# Documentation (no bump)
git commit -m "docs: update README with installation guide"

# Maintenance (no bump)
git commit -m "chore: update dependencies to latest versions"
```

## 🚀 Automation Triggers

### Automatic Triggers:
- **Push to main branch** with conventional commits
- **Merge pull requests** with conventional commit messages

### Manual Triggers:
- **GitHub Actions workflow dispatch** (manual run)
- **Force release** option in workflow inputs

## 📋 Current Configuration Files

### 1. Semantic Release (`.releaserc.json`):
- Analyzes conventional commits
- Generates changelog automatically
- Creates GitHub releases
- Updates package.json version
- Creates git tags

### 2. Commitlint (`commitlint.config.js`):
- Validates commit message format
- Enforces conventional commit standards
- Runs on pre-commit hook

### 3. GitHub Actions (`complete-pipeline.yml`):
- Builds and tests code
- Runs semantic-release
- Publishes to VS Code Marketplace
- Creates GitHub releases

## 🎯 Next Steps

To trigger automatic version bumping:

1. **Make changes to your code**
2. **Commit with conventional format**:
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```
3. **Push to main branch**:
   ```bash
   git push origin main
   ```
4. **Watch GitHub Actions** automatically:
   - Detect the commit type
   - Bump version accordingly
   - Create changelog entry
   - Create git tag
   - Publish release

## 🔍 Monitoring

- **GitHub Actions**: Check workflow runs in repository Actions tab
- **Releases**: View created releases in GitHub Releases section
- **Tags**: See version tags in repository
- **Changelog**: Automatically updated `CHANGELOG.md`

---

**Your automation is ready to use! Just commit with conventional format and push to main.**
