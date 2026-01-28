# GitHub Repository Setup Guide

This guide will help you push KhanFlow to GitHub and configure it for production use.

## Initial Repository Setup

### 1. Create GitHub Repository

1. Go to [GitHub](https://github.com/new)
2. Create a new repository:
   - Name: `khanflow`
   - Description: "AI-powered scheduling and task management platform"
   - Visibility: Private (recommended initially)
   - **DO NOT** initialize with README, .gitignore, or license (we have these)

### 2. Configure Git (if not done)

```bash
cd /Users/md.mashiurrahmankhan/Downloads/projects/khanflow

# Check current status
git status

# Check if remote exists
git remote -v

# If no remote exists, add it
git remote add origin https://github.com/yourusername/khanflow.git

# If remote exists but wrong URL, update it
git remote set-url origin https://github.com/yourusername/khanflow.git
```

### 3. Verify Clean State

```bash
# Ensure all unnecessary files are gitignored
git status

# You should NOT see:
# - node_modules/
# - .env files (except .env.example)
# - dist/ or build/ directories
# - test-results/
# - .next/
```

### 4. Initial Commit (if needed)

```bash
# Check current branch
git branch

# If not on main, create and switch
git checkout -b main

# Add all files
git add .

# Commit with meaningful message
git commit -m "feat: initial production-ready release

- Complete authentication system with OAuth
- Calendar and task integrations
- Voice assistant with AI
- Docker deployment configuration
- Comprehensive documentation
- CI/CD pipeline setup"

# Push to GitHub
git push -u origin main
```

## Branch Strategy

### Main Branches

```bash
# Create develop branch
git checkout -b develop
git push -u origin develop

# Set default branch to main on GitHub
# Go to: Settings → Branches → Default branch
```

### Branch Protection Rules

Configure on GitHub: **Settings → Branches → Add rule**

**For `main` branch:**
- ✅ Require pull request before merging
- ✅ Require approvals: 1
- ✅ Require status checks to pass
  - CI/CD Pipeline
  - Backend Tests
  - Frontend Tests
- ✅ Require branches to be up to date
- ✅ Require conversation resolution before merging
- ✅ Do not allow bypassing the above settings

**For `develop` branch:**
- ✅ Require pull request before merging
- ✅ Require status checks to pass

## GitHub Secrets Configuration

Add these secrets for CI/CD: **Settings → Secrets and variables → Actions**

### Required Secrets

```
AWS_ACCESS_KEY_ID          # AWS credentials for deployment
AWS_SECRET_ACCESS_KEY      # AWS credentials for deployment
AWS_REGION                 # e.g., us-east-1

# Optional: For automated deployments
DATABASE_URL               # Production database URL
JWT_SECRET                 # Production JWT secret
OPENAI_API_KEY            # OpenAI API key
```

### How to Add Secrets

```bash
# In GitHub repository:
# Settings → Secrets and variables → Actions → New repository secret

# Add each secret with:
# Name: SECRET_NAME
# Value: secret_value
```

## Repository Settings

### General Settings

**Settings → General:**
- ✅ Wikis (optional)
- ✅ Issues
- ✅ Discussions (optional)
- ✅ Projects (optional)
- ✅ Allow merge commits
- ✅ Allow squash merging
- ✅ Allow rebase merging
- ✅ Automatically delete head branches

### Collaborators

**Settings → Collaborators:**
- Add team members with appropriate permissions
- Use teams for better organization

### Labels

Create labels for issue tracking:
```
- bug (red)
- enhancement (green)
- documentation (blue)
- feature (purple)
- help wanted (yellow)
- good first issue (light green)
- priority:high (red)
- priority:medium (orange)
- priority:low (yellow)
```

### Issue Templates

GitHub will auto-detect from `.github/ISSUE_TEMPLATE/` if you create them.

## Additional GitHub Configuration

### 1. About Section

Update repository description:
```
🚀 AI-powered scheduling and task management platform
🌐 khanflow.com (if you have a website)
```

Add topics:
```
typescript, nextjs, express, postgresql, openai, oauth, docker, aws
```

### 2. Repository Social Preview

Upload a preview image (1280x640px):
- Settings → Social preview → Upload image

### 3. Code Owners (Optional)

Create `.github/CODEOWNERS`:
```
# Default owners
* @yourusername

# Backend
/backend/ @backend-team

# Frontend
/new-frontend/ @frontend-team

# Documentation
/docs/ @documentation-team

# CI/CD
/.github/ @devops-team
```

## Enable GitHub Actions

1. Go to **Actions** tab
2. Click "I understand my workflows, go ahead and enable them"
3. Verify workflows run on push

## Documentation Links

Add these to repository description/README:
- 📖 [Documentation](docs/)
- 🚀 [Deployment Guide](docs/deployment/)
- 🤝 [Contributing](CONTRIBUTING.md)
- 📋 [Changelog](CHANGELOG.md)

## Tagging Releases

### Create First Release

```bash
# Tag the current commit
git tag -a v1.0.0 -m "Release v1.0.0 - Initial production release"
git push origin v1.0.0
```

### GitHub Release

1. Go to **Releases** → **Draft a new release**
2. Choose tag: `v1.0.0`
3. Release title: `v1.0.0 - Initial Production Release`
4. Description: Copy from CHANGELOG.md
5. Attach binaries (if any)
6. Publish release

## Verification Checklist

After pushing to GitHub:

- [ ] Repository visible at correct URL
- [ ] README displays properly
- [ ] All documentation links work
- [ ] .env files NOT visible in repository
- [ ] GitHub Actions workflows visible
- [ ] Branch protection rules active
- [ ] Secrets configured
- [ ] Collaborators added
- [ ] About section updated
- [ ] Labels created
- [ ] First release tagged

## Clone and Test

Verify the repository works for new users:

```bash
# Clone in a new location
cd ~/test
git clone https://github.com/yourusername/khanflow.git
cd khanflow

# Follow README setup instructions
# Ensure everything works
```

## Ongoing Maintenance

### Daily
- Monitor Issues and PRs
- Review CI/CD status
- Check security alerts

### Weekly
- Review and merge approved PRs
- Update dependencies
- Review analytics

### Monthly
- Security audit
- Performance review
- Documentation updates
- Release planning

## Common Git Commands

```bash
# Update from remote
git pull origin main

# Create feature branch
git checkout -b feature/new-feature

# Add changes
git add .
git commit -m "feat: add new feature"

# Push branch
git push origin feature/new-feature

# Merge develop into main (after PR approval)
git checkout main
git merge develop
git push origin main

# Tag release
git tag -a v1.1.0 -m "Release v1.1.0"
git push origin v1.1.0

# Delete local branch
git branch -d feature/old-feature

# Delete remote branch
git push origin --delete feature/old-feature
```

## Support

For questions about GitHub setup:
- [GitHub Docs](https://docs.github.com)
- [GitHub Actions Docs](https://docs.github.com/en/actions)

---

**Ready to push to GitHub!** 🚀

Follow the steps above, and your repository will be production-ready.
