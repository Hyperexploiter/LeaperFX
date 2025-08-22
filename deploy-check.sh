#!/bin/bash

echo "🚀 LeaperFX GitHub Pages Deployment Check"
echo "==========================================="

# Navigate to the dashboard demo directory
cd "$(dirname "$0")/dashboard/demo" || exit 1

echo "📁 Current directory: $(pwd)"
echo ""

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found!"
    exit 1
fi

echo "📦 Installing dependencies..."
npm ci --silent || {
    echo "❌ npm install failed!"
    exit 1
}

echo "✅ Dependencies installed successfully"
echo ""

echo "🏗️  Building application..."
NODE_ENV=production npm run build || {
    echo "❌ Build failed!"
    exit 1
}

echo "✅ Build completed successfully"
echo ""

# Check if build output exists
if [ ! -d "dist" ]; then
    echo "❌ Build output directory 'dist' not found!"
    exit 1
fi

echo "📊 Build output summary:"
echo "----------------------"
ls -la dist/
echo ""

# Check critical files
critical_files=("index.html")
for file in "${critical_files[@]}"; do
    if [ -f "dist/$file" ]; then
        echo "✅ Found: $file"
    else
        echo "❌ Missing critical file: $file"
        exit 1
    fi
done

echo ""
echo "🎉 Deployment check passed!"
echo ""
echo "📋 Next steps:"
echo "1. Commit and push the .github/workflows/deploy.yml file"
echo "2. Enable GitHub Pages in your repository settings"
echo "3. Set Pages source to 'GitHub Actions'"
echo "4. Push to the 'hyp3r' branch to trigger deployment"
echo ""
echo "🌐 Your app will be available at:"
echo "   https://hyperexploiter.github.io/LeaperFX/"
echo ""