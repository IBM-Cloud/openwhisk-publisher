# load configuration variables
source local.env

function usage() {
  echo "Usage: $0 [--install,--uninstall,--update,--env]"
}

function install() {
  echo "Creating publisher package"
  wsk package create publisher

  echo "Creating actions"
  wsk action create -t 300000 --docker publisher/jekyll $JEKYLL_DOCKER_IMAGE\
    -p OS_USER_ID "$OS_USER_ID" \
    -p OS_PASSWORD "$OS_PASSWORD" \
    -p OS_PROJECT_ID "$OS_PROJECT_ID" \
    -p OS_REGION_NAME "$OS_REGION_NAME" \
    -p OS_CONTAINER_NAME "$OS_CONTAINER_NAME"

  echo "Binding GitHub"
  wsk package bind /whisk.system/github publisher-github --param username $GITHUB_USERNAME --param repository $GITHUB_REPO --param accessToken $GITHUB_TOKEN

  echo "Listening to GitHub push events"
  wsk trigger create publisher-github-trigger --feed publisher-github/webhook --param events push

  echo "Creating Github event change listener"
  wsk action create publisher-github-changelistener changelistener.js

  echo "Enabling change listener"
  wsk rule create publisher-github-rule publisher-github-trigger publisher-github-changelistener

  wsk list
}

function uninstall() {
  echo "Removing actions..."
  wsk action delete publisher/jekyll

  echo "Removing rule..."
  wsk rule disable publisher-github-rule
  wsk rule delete publisher-github-rule

  echo "Removing change listener..."
  wsk action delete publisher-github-changelistener

  echo "Removing trigger..."
  wsk trigger delete publisher-github-trigger

  echo "Removing packages..."
  wsk package delete publisher-github
  wsk package delete publisher

  echo "Done"
  wsk list
}

function update() {
  wsk action update publisher-github-changelistener changelistener.js
}

function disable() {
  wsk rule disable publisher-github-rule
}

function enable() {
  wsk rule enable publisher-github-rule
}

function showenv() {
  echo JEKYLL_DOCKER_IMAGE=$JEKYLL_DOCKER_IMAGE
  echo OS_USER_ID=$OS_USER_ID
  echo OS_PASSWORD=$OS_PASSWORD
  echo OS_PROJECT_ID=$OS_PROJECT_ID
  echo OS_REGION_NAME=$OS_REGION_NAME
  echo OS_CONTAINER_NAME=$OS_CONTAINER_NAME
  echo GITHUB_USERNAME=$GITHUB_USERNAME
  echo GITHUB_TOKEN=$GITHUB_TOKEN
  echo GITHUB_REPO=$GITHUB_REPO
}

case "$1" in
"--install" )
install
;;
"--uninstall" )
uninstall
;;
"--update" )
update
;;
"--env" )
showenv
;;
"--disable" )
disable
;;
"--enable" )
enable
;;
* )
usage
;;
esac
