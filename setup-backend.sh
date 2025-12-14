#!/bin/bash

echo "🚀 Setting up your Convex backend..."
echo ""

# Create demo user
echo "📝 Creating demo user..."
npx --yes convex run users:signUp '{
  "email": "demo@lift.app",
  "password": "demo123",
  "name": "Demo User"
}' > /tmp/signup_result.json 2>&1

# Extract userId from the result
USER_ID=$(cat /tmp/signup_result.json | grep -o '"userId":"[^"]*"' | cut -d'"' -f4)

if [ -z "$USER_ID" ]; then
  echo "⚠️  User might already exist, trying to get existing user..."
  USER_ID="jh7e62tj7x5tjyxat7djyvrg5x7x69dh"
fi

echo "✅ User ID: $USER_ID"
echo ""

# Create exercises
echo "💪 Creating exercise templates..."
npx --yes convex run seedExercises:createDefaultExercises "{\"userId\":\"$USER_ID\"}"

echo ""
echo "✅ Backend setup complete!"
echo ""
echo "📱 You can now start your app with: npm start"
echo "🔐 Login credentials:"
echo "   Email: demo@lift.app"
echo "   Password: demo123"
