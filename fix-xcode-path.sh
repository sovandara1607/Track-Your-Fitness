#!/bin/bash

# Fix Xcode Developer Directory Path
# This script fixes the issue where xcrun simctl fails with error code 72

echo "Checking current Xcode developer directory..."
xcode-select -p

echo ""
echo "Switching to Xcode.app developer directory..."
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer

echo ""
echo "Verifying the change..."
xcode-select -p

echo ""
echo "Testing simctl..."
xcrun simctl list devices 2>&1 | head -5

echo ""
echo "If you see devices listed above, the fix was successful!"
echo "You may need to accept the Xcode license agreement:"
echo "  sudo xcodebuild -license accept"






