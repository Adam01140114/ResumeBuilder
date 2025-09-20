# PowerShell script to create .env file for Resume Builder
# Run this script to set up environment variables

Write-Host "Setting up environment variables for Resume Builder..." -ForegroundColor Green

# Create .env file
$envContent = @"
# AI Configuration
OPENAI_API_KEY=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

# Firebase Configuration
FIREBASE_API_KEY=AIzaSyCZJEsfHFPLVqKOyM9fhw7iEE-bxInzmTI
FIREBASE_AUTH_DOMAIN=resumebuilder-7b339.firebaseapp.com
FIREBASE_PROJECT_ID=resumebuilder-7b339
FIREBASE_STORAGE_BUCKET=resumebuilder-7b339.firebasestorage.app
"@

# Write to .env file
$envContent | Out-File -FilePath ".env" -Encoding UTF8

Write-Host "✅ .env file created successfully!" -ForegroundColor Green
Write-Host "📝 Remember to add .env to your .gitignore file!" -ForegroundColor Yellow

# Check if .gitignore exists and add .env if not present
if (Test-Path ".gitignore") {
    $gitignoreContent = Get-Content ".gitignore"
    if ($gitignoreContent -notcontains ".env") {
        Add-Content -Path ".gitignore" -Value "`n# Environment variables`n.env"
        Write-Host "✅ Added .env to .gitignore file" -ForegroundColor Green
    } else {
        Write-Host "ℹ️  .env already in .gitignore" -ForegroundColor Blue
    }
} else {
    Write-Host "⚠️  No .gitignore file found. Consider creating one and adding .env to it." -ForegroundColor Yellow
}

Write-Host "`n🚀 Environment setup complete!" -ForegroundColor Green
Write-Host "You can now run your application with environment variables loaded." -ForegroundColor Cyan
