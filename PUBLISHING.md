# Publishing Guide

This document explains how to publish the AI Code Review Assistant extension to both VS Code Marketplace and Eclipse Marketplace (Open VSX Registry) using automated GitHub Actions workflows.

## Prerequisites

### 1. Required Accounts and Tokens

#### VS Code Marketplace (Microsoft)
1. Create an Azure DevOps account at https://dev.azure.com
2. Go to User Settings → Personal Access Tokens
3. Create a new token with:
   - **Name**: VS Code Extension Publishing
   - **Organization**: All accessible organizations
   - **Expiration**: 1 year (or custom)
   - **Scopes**: Custom defined → Marketplace → **Manage**
4. Copy the token and save it securely

#### Eclipse Marketplace (Open VSX Registry)
1. Sign in to https://open-vsx.org with your GitHub account
2. Go to User Settings → Access Tokens
3. Create a new token with:
   - **Description**: Extension Publishing
   - **Scopes**: publish
4. Copy the token and save it securely

### 2. GitHub Repository Setup

Add the following secrets to your GitHub repository:
1. Go to Settings → Secrets and variables → Actions
2. Click "New repository secret" and add:
   - **Name**: `VSCE_PAT`
   - **Value**: Your Azure DevOps Personal Access Token
3. Add another secret:
   - **Name**: `OVSX_PAT`
   - **Value**: Your Open VSX Registry Personal Access Token

### 3. Local Development Setup

1. Install required tools globally:
   ```bash
   npm install -g @vscode/vsce ovsx
   ```

2. Update your local `.env` file with the tokens:
   ```bash
   VSCE_PAT=your_azure_devops_pat_here
   OVSX_PAT=your_open_vsx_pat_here
   ```

## Publishing Methods

### Method 1: Automatic Publishing (Recommended)

#### For Stable Releases
1. **Version Bump**: Use the GitHub Actions workflow
   - Go to Actions → "Version Bump"
   - Click "Run workflow"
   - Select version type (patch/minor/major)
   - Enable "Automatically publish to marketplaces"
   - Click "Run workflow"

2. **Manual Tag Creation**: 
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
   This will automatically trigger the publishing workflow.

#### For Pre-releases
Pre-releases are automatically published when you push to:
- `develop` branch
- `beta` branch
- `release/*` branches

### Method 2: Manual Publishing

#### Local Publishing
```bash
# Build the extension
npm run package

# Package as VSIX
npm run package:vsix

# Publish to both marketplaces
npm run publish:all

# Or publish individually
npm run publish:vscode  # VS Code Marketplace only
npm run publish:ovsx    # Open VSX Registry only

# Publish pre-release
npm run publish:prerelease
```

#### Manual GitHub Workflow Trigger
1. Go to Actions → "Publish Extension"
2. Click "Run workflow"
3. Select branch and options
4. Click "Run workflow"

## Workflow Details

### 1. Main Publishing Workflow (`publish-extension.yml`)
- **Triggers**: Version tags (`v*.*.*`) or manual dispatch
- **Steps**:
  1. Run tests and linting
  2. Build extension
  3. Package as VSIX
  4. Publish to VS Code Marketplace
  5. Publish to Open VSX Registry
  6. Create GitHub release
  7. Upload VSIX as release asset

### 2. Pre-release Workflow (`publish-prerelease.yml`)
- **Triggers**: Push to development branches
- **Features**:
  - Automatic version numbering with branch and commit info
  - Pre-release publishing to both marketplaces
  - Artifact upload for testing

### 3. Version Bump Workflow (`version-bump.yml`)
- **Features**:
  - Semantic versioning (patch/minor/major)
  - Automatic changelog updates
  - Git tag creation
  - Optional automatic publishing

## Version Management

### Semantic Versioning
- **Patch** (1.0.1): Bug fixes and small improvements
- **Minor** (1.1.0): New features, backward compatible
- **Major** (2.0.0): Breaking changes

### Pre-release Versioning
Pre-releases use the format: `1.0.0-branch.commit`
- Example: `1.0.0-develop.abc1234`

## Quality Gates

All publishing workflows include these quality checks:
- ✅ TypeScript compilation
- ✅ ESLint code quality
- ✅ Extension packaging
- ✅ Test execution (continues on failure)

## Troubleshooting

### Common Issues

1. **Token Expired**
   - Regenerate tokens in respective platforms
   - Update GitHub repository secrets

2. **Publishing Failed**
   - Check workflow logs in GitHub Actions
   - Verify token permissions
   - Ensure version number is unique

3. **Tests Failing**
   - Fix test issues before publishing
   - Tests are set to continue-on-error for now

### Manual Recovery

If automated publishing fails:
```bash
# Download the VSIX from GitHub Actions artifacts
# Install locally to test
code --install-extension path/to/extension.vsix

# Manually publish if needed
vsce publish --pat YOUR_VSCE_PAT
ovsx publish --pat YOUR_OVSX_PAT
```

## Monitoring

### Check Publishing Status
1. **VS Code Marketplace**: https://marketplace.visualstudio.com/manage/publishers/vuquangkhtn
2. **Open VSX Registry**: https://open-vsx.org/user-settings/extensions
3. **GitHub Actions**: Repository → Actions tab

### Analytics
- VS Code Marketplace provides download and rating analytics
- GitHub Releases show download statistics for VSIX files

## Best Practices

1. **Always test locally** before publishing
2. **Use pre-releases** for beta features
3. **Update changelog** with meaningful descriptions
4. **Monitor both marketplaces** after publishing
5. **Keep tokens secure** and rotate regularly
6. **Test installation** from both marketplaces

## Support

For issues with:
- **VS Code Marketplace**: Contact Microsoft support
- **Open VSX Registry**: Create issue at https://github.com/eclipse/openvsx
- **GitHub Actions**: Check repository Actions tab and logs