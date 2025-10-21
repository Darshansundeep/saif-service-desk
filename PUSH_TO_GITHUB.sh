#!/bin/bash

# SAIF Service Desk - GitHub Push Script
# This script will help you push the project to GitHub

echo "🚀 SAIF Service Desk - GitHub Push Helper"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}📦 Initializing Git repository...${NC}"
    git init
    echo -e "${GREEN}✅ Git initialized${NC}"
else
    echo -e "${GREEN}✅ Git already initialized${NC}"
fi

echo ""
echo "📋 Pre-Push Checklist:"
echo "======================"

# Check for .env files
if [ -f ".env.local" ]; then
    echo -e "${GREEN}✅ .env.local exists (will be ignored by git)${NC}"
else
    echo -e "${YELLOW}⚠️  .env.local not found${NC}"
fi

# Check for node_modules
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅ node_modules exists (will be ignored by git)${NC}"
else
    echo -e "${YELLOW}⚠️  node_modules not found - run 'npm install'${NC}"
fi

# Check for Docker files
if [ -f "Dockerfile" ] && [ -f "docker-compose.yml" ]; then
    echo -e "${GREEN}✅ Docker files present${NC}"
else
    echo -e "${RED}❌ Docker files missing${NC}"
fi

# Check for documentation
if [ -f "README.md" ] && [ -f "DOCKER_DEPLOYMENT.md" ]; then
    echo -e "${GREEN}✅ Documentation complete${NC}"
else
    echo -e "${YELLOW}⚠️  Some documentation missing${NC}"
fi

echo ""
echo "🔍 Checking for sensitive files..."

# Check if .env is in gitignore
if grep -q ".env" .gitignore; then
    echo -e "${GREEN}✅ .env files are in .gitignore${NC}"
else
    echo -e "${RED}❌ WARNING: .env not in .gitignore!${NC}"
    exit 1
fi

echo ""
echo "📊 Repository Status:"
echo "===================="

# Show git status
git status --short

echo ""
echo "📝 Files to be committed:"
git status --short | wc -l | xargs echo "Total files:"

echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Review the files above before committing!${NC}"
echo ""

# Ask for confirmation
read -p "Do you want to add all files? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}📦 Adding all files...${NC}"
    git add .
    echo -e "${GREEN}✅ Files added${NC}"
    
    echo ""
    echo "📝 Creating commit..."
    git commit -m "Initial commit: SAIF Service Desk System

Features:
- Complete ticket management system
- Role-based access control (Admin, L1/L2 Agents, Customers)
- SLA tracking and management
- Status-based workflow with escalation
- Pagination and advanced filtering
- File attachments support
- Email notifications
- Audit logging
- Docker support with PostgreSQL
- Cloud deployment ready

Tech Stack:
- Next.js 15 (App Router)
- TypeScript
- PostgreSQL 16
- TailwindCSS
- Shadcn/ui components
- Docker & Docker Compose
"
    
    echo -e "${GREEN}✅ Commit created${NC}"
    
    echo ""
    echo "🌐 Next Steps:"
    echo "=============="
    echo "1. Create a new repository on GitHub:"
    echo "   https://github.com/new"
    echo ""
    echo "2. Repository name: saif-service-desk (or your choice)"
    echo "3. DO NOT initialize with README"
    echo ""
    echo "4. Then run these commands:"
    echo ""
    echo -e "${YELLOW}   git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git${NC}"
    echo -e "${YELLOW}   git branch -M main${NC}"
    echo -e "${YELLOW}   git push -u origin main${NC}"
    echo ""
    echo "5. Create a tag for the release:"
    echo -e "${YELLOW}   git tag -a v1.0.0 -m 'Release v1.0.0'${NC}"
    echo -e "${YELLOW}   git push origin v1.0.0${NC}"
    echo ""
    echo -e "${GREEN}✅ Ready to push to GitHub!${NC}"
else
    echo -e "${RED}❌ Cancelled${NC}"
    exit 0
fi

echo ""
echo "🎉 Setup complete! Follow the next steps above to push to GitHub."
