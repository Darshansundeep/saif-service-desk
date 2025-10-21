# 📦 GitHub Setup Guide

This guide will help you push the Service Ticket System to GitHub.

## Prerequisites

- Git installed on your machine
- GitHub account
- SSH key configured (or use HTTPS)

## Step 1: Initialize Git Repository

If not already initialized:

```bash
cd /Users/darshansangaraju/Downloads/service-ticket-system
git init
```

## Step 2: Create .gitignore

The `.gitignore` file is already configured to exclude:
- `node_modules/`
- `.env*` files (secrets)
- `.next/` build files
- `uploads/` directory
- IDE files

## Step 3: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `service-ticket-system` (or your preferred name)
3. Description: "SAIF Service Desk - A comprehensive ticket management system"
4. Choose Public or Private
5. **DO NOT** initialize with README (we already have one)
6. Click "Create repository"

## Step 4: Add Files to Git

```bash
# Add all files
git add .

# Check what will be committed
git status

# Commit
git commit -m "Initial commit: SAIF Service Desk System

Features:
- Ticket management with SLA tracking
- Role-based access (Admin, Agent L1/L2, Customer)
- Status-based workflow
- File attachments
- Email notifications
- Audit logging
- Docker support
- Pagination and filtering
"
```

## Step 5: Connect to GitHub

Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual values:

### Using SSH (Recommended):

```bash
git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

### Using HTTPS:

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

## Step 6: Verify Upload

Visit your repository on GitHub:
```
https://github.com/YOUR_USERNAME/YOUR_REPO_NAME
```

## Step 7: Add Repository Secrets (for CI/CD)

If you plan to use GitHub Actions:

1. Go to repository Settings → Secrets and variables → Actions
2. Add these secrets:
   - `DB_PASSWORD`: Your database password
   - `JWT_SECRET`: Your JWT secret key

## Step 8: Create a Good README

The repository already has comprehensive documentation:
- `README.md` - Main documentation
- `DOCKER_DEPLOYMENT.md` - Docker deployment guide
- `QUICK_START.md` - Quick start guide
- `LOCAL_SETUP.md` - Local development setup

## Step 9: Add Topics/Tags

On GitHub repository page:
1. Click the gear icon next to "About"
2. Add topics:
   - `ticket-system`
   - `service-desk`
   - `nextjs`
   - `postgresql`
   - `docker`
   - `typescript`
   - `helpdesk`
   - `sla-management`

## Step 10: Create Releases

### Tag the initial release:

```bash
git tag -a v1.0.0 -m "Initial release: SAIF Service Desk v1.0.0"
git push origin v1.0.0
```

### On GitHub:
1. Go to Releases
2. Click "Create a new release"
3. Choose tag `v1.0.0`
4. Title: "SAIF Service Desk v1.0.0"
5. Description: List features and improvements
6. Publish release

## Future Updates

### Making Changes:

```bash
# Make your changes to files

# Stage changes
git add .

# Commit with descriptive message
git commit -m "Add: New feature description"

# Push to GitHub
git push origin main
```

### Commit Message Convention:

```
Add: New feature
Fix: Bug fix
Update: Improvements
Remove: Removed feature
Docs: Documentation changes
Style: Code style changes
Refactor: Code refactoring
```

## Branch Strategy

### For team development:

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "Add: New feature"

# Push feature branch
git push origin feature/new-feature

# Create Pull Request on GitHub
# After review and merge, delete branch
git checkout main
git pull origin main
git branch -d feature/new-feature
```

## Collaboration

### Adding Collaborators:

1. Go to repository Settings → Collaborators
2. Click "Add people"
3. Enter GitHub username or email
4. Choose permission level

### Protecting Main Branch:

1. Settings → Branches
2. Add rule for `main`
3. Enable:
   - Require pull request reviews
   - Require status checks
   - Include administrators

## GitHub Actions (Optional)

Create `.github/workflows/ci.yml` for automated testing:

```yaml
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build
      run: npm run build
```

## License

Add a LICENSE file:

```bash
# MIT License (example)
cat > LICENSE << 'EOF'
MIT License

Copyright (c) 2025 SAIF

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
EOF

git add LICENSE
git commit -m "Add: MIT License"
git push origin main
```

## Troubleshooting

### Large Files Error:

```bash
# If you accidentally committed large files
git rm --cached large-file.zip
echo "large-file.zip" >> .gitignore
git commit -m "Remove large file"
```

### Reset to Remote:

```bash
git fetch origin
git reset --hard origin/main
```

### Undo Last Commit:

```bash
# Keep changes
git reset --soft HEAD~1

# Discard changes
git reset --hard HEAD~1
```

## Best Practices

1. ✅ **Never commit secrets** (.env files are ignored)
2. ✅ **Write clear commit messages**
3. ✅ **Use branches for features**
4. ✅ **Review code before merging**
5. ✅ **Keep README updated**
6. ✅ **Tag releases**
7. ✅ **Document breaking changes**

## Repository Structure

```
service-ticket-system/
├── app/                    # Next.js app directory
├── components/             # React components
├── lib/                    # Utility libraries
├── public/                 # Static assets
├── scripts/                # Database scripts
├── styles/                 # Global styles
├── Dockerfile              # Docker configuration
├── docker-compose.yml      # Docker Compose setup
├── README.md               # Main documentation
├── DOCKER_DEPLOYMENT.md    # Docker guide
├── package.json            # Dependencies
└── .gitignore             # Git ignore rules
```

---

**Ready to push to GitHub! 🚀**
