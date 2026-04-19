#!/bin/bash
set -e

echo "Packaging Lambda function..."

# Install all dependencies into a flat target directory
pip install -r requirements.txt -t ./package --quiet

# Copy all root-level Python source files into the package
cp *.py package/

# Create the ZIP from inside the package directory
cd package
zip -r ../infra/lambda.zip . --quiet
cd ..

# Clean up the temporary directory
rm -rf package

echo "Done: infra/lambda.zip created"
ls -lh infra/lambda.zip
