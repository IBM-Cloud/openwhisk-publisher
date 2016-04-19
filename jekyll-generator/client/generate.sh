#!/bin/bash -e
#//------------------------------------------------------------------------------
#// Licensed under the Apache License, Version 2.0 (the "License");
#// you may not use this file except in compliance with the License.
#// You may obtain a copy of the License at
#//
#//    http://www.apache.org/licenses/LICENSE-2.0
#//
#// Unless required by applicable law or agreed to in writing, software
#// distributed under the License is distributed on an "AS IS" BASIS,
#// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#// See the License for the specific language governing permissions and
#// limitations under the License.
#//------------------------------------------------------------------------------

# stop the script execution on error
set -e

echo "Current environment:"
env

# configure swift client from action parameter
export OS_USER_ID=$OW_PARAM_OS_USER_ID
export OS_PASSWORD=$OW_PARAM_OS_PASSWORD
export OS_PROJECT_ID=$OW_PARAM_OS_PROJECT_ID
export OS_REGION_NAME=$OW_PARAM_OS_REGION_NAME

# default values for Bluemix Object Storage
export OS_AUTH_URL=https://identity.open.softlayer.com/v3
export OS_IDENTITY_API_VERSION=3
export OS_AUTH_VERSION=3

# where to put the generated files
OS_CONTAINER_NAME=$OW_PARAM_OS_CONTAINER_NAME

# our temporary directory where to generate the site
WORK_DIR=`mktemp -d`
echo "Working directory $WORK_DIR"

echo "Retrieving Jekyll source files..."
wget -q -O "$WORK_DIR/input.zip" "$OW_PARAM_archive"

# Extract it
echo "Extracting files..."
mkdir -p "$WORK_DIR/extracted"
unzip -q "$WORK_DIR/input.zip" -d "$WORK_DIR/extracted"

# Find the Jekyll configuration file
CONFIG_FILE=`find "$WORK_DIR/extracted" -name "_config.yml" | head -1`

# Generate
echo "Generating using $CONFIG_FILE..."
mkdir -p "$WORK_DIR/site"
jekyll build --config "$CONFIG_FILE" --source "`dirname $CONFIG_FILE`" --destination "$WORK_DIR/site"

cd "$WORK_DIR/site"

# Delete the existing container
swift delete "$OS_CONTAINER_NAME" || true

# Upload the files
echo "Uploading generated site..."
swift upload "$OS_CONTAINER_NAME" .

# Make the container visible to the world
echo "Making website public..."
swift post "$OS_CONTAINER_NAME" -r ".r:*"

# Index.html as default file
echo "Enabling index.html as default file..."
swift post "$OS_CONTAINER_NAME" --meta "Web-Index:index.html"

echo "Removing temp directory..."
rm -r "$WORK_DIR"

echo "Done!"
