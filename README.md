# Static website generation with Jekyll, Object Storage and OpenWhisk in Bluemix.

Jekyll is one of many popular static website generators.
Given a set of plain texts (html, css, markdown), these tools generate a full website.
Ideal for simple webpages, blogs where you do not want to run a database or maintain
a complex content management system.

Once you have modified your files, the next steps are usually to generate the site and
then to upload the generated files to your hosting company server.

This example is about simplifying even further this process. Once configured, the only
thing you have to worry about is to work on your content and commit the files to GitHub.
From there, OpenWhisk takes charge of generating the new website and deploying it.

  Note: This example does not aim to be a *one-size fits all solution* but serves the purpose
  of highlighting the concepts behind a static website generation workflow.
  The [generation action](jekyll-generator/client/generate.sh) assumes a simple Jekyll website with no plugin.
  It could be easily updated to handle more complex generation cases.

## Overview

 Built using IBM Bluemix, the application uses:
  * [IBM Bluemix OpenWhisk](https://new-console.ng.bluemix.net/openwhisk)
  * [Object Storage](https://console.ng.bluemix.net/catalog/services/Object-Storage)
  * [Cloud Foundry Static buildpack](https://github.com/cloudfoundry/staticfile-buildpack)

Every time a user commits to the repository monitored by OpenWhisk,
the application retrieves the repository files, calls Jekyll and uploads
the generate website to an Object Storage container.

![Architecture](http://g.gravizo.com/g?
  digraph G {
    node [fontname = "helvetica"]
    rankdir=LR
    /* commits to github */
    author -> github [label="Commits"]
    /* github notifies openwhisk */
    github -> openwhisk [label="Notifies"]
    /* openwhisk calls jekyll action */
    openwhisk -> jekyll [label="Triggers"]
    /* jekyll produces files and passes them to swift */
    jekyll -> objectstorage [label="Generates files"]
    /* web user */
    user -> nginx [label="Accesses website"]
    nginx -> objectstorage [label="Retrieves content"]
    /* styling */
    github [shape=circle style=filled color="%234E96DB" fontcolor=white label="GitHub"]
    openwhisk [shape=circle style=filled color="%2324B643" fontcolor=white label="OpenWhisk"]
    objectstorage [shape=circle style=filled color="%234E96DB" fontcolor=white label="Object Storage"]
    nginx [shape=rectangle style=filled color="%234E96DB" fontcolor=white label="nginx app"]
  }
)

## Application Requirements

* IBM Bluemix account. [Sign up][bluemix_signup_url] for Bluemix, or use an existing account.
* IBM Bluemix OpenWhisk early access. [Sign up for Bluemix OpenWhisk](https://new-console.ng.bluemix.net/openwhisk).
* Docker Hub account. [Sign up](https://hub.docker.com/) for Docker Hub, or use an existing account. 

## Deploy the solution

### Create a new GitHub repository with Jekyll 3 content

* Follow the [quick start guide](https://jekyllrb.com/docs/quickstart/) to create a Jekyll directory structure and then commit the site to GitHub

or

* a simpler approach, [fork **Poole** a foundational setup for any Jekyll site](https://github.com/poole/poole#fork-destination-box)

### Get the code

* Clone the app to your local environment from your terminal using the following command:

  ```
  git clone https://github.com/l2fprod/openwhisk-publisher.git
  ```

### Create the Object Storage in Bluemix

1. Open the IBM Bluemix console

1. Create a [Object Storage](https://console.ng.bluemix.net/catalog/services/Object-Storage) instance named **objectstorage-for-publisher**
or using the command line
  ```
  cf create-service Object-Storage Free objectstorage-for-publisher
  ```

***Note***: *if you have an existing instance of this service,
you can simply reuse the existing one. Only make sure to use another container name
to store the generated files as the generation process deletes and recreates it.*

### Get a GitHub access token

To be notified of GitHub commits, the application needs to register a webhook in GitHub
through the [OpenWhisk GitHub package](https://new-console.ng.bluemix.net/docs/openwhisk/openwhisk_catalog.html#openwhisk_catalog_GitHub).
This requires to obtain a GitHub access token.

1. Go to [GitHub Personal Tokens](https://github.com/settings/tokens).

1. Generate a new token with the scopes *public_repo, repo:status*.

1. Make note of the token, you'll use it in the steps below.

### Build the Jekyll generator image

To build the jekyll-generator image, follow these steps:

1. Change to the ***jekyll-generator*** directory.

1. Ensure your Docker environment works and that you have logged in Docker hub.

1. Run

  ```
  ./buildAndPush.sh youruserid/yourimagename
  ```
  Note: On some systems this command needs to be run with `sudo`.
  
1. After a while, your image will be available in Docker Hub, ready for OpenWhisk.

### Deploy OpenWhisk Actions

1. Copy the file named **template.local.env** into **local.env**

  ```
  cp template.local.env local.env
  ```

1. Retrieve the credentials of the Object Storage service you created before.
You can find them in the Bluemix console under the Credentials section for the service.
If there are none, create a new set of credentials from the console or using the command line:

  ```
  cf create-service-key objectstorage-for-publisher for-openwhisk
  ```
  
  and to get the values:
  
  ```
  cf service-key objectstorage-for-publisher for-openwhisk
  ```

1. Set the variable values in `local.env` using the Object Storage credentials, GitHub tokens.
These variables will be injected into the generation action.

1. Set the name of your GitHub repository where you are hosting your Jekyll site.
As example if your repo is https://github.com/fred/mywebsite, set the GITHUB_REPO to mywebsite.

1. Make sure to also update the value of ***JEKYLL_DOCKER_IMAGE*** with the name of the Docker
image you created in the previous section.

1. Ensure your OpenWhisk command line interface is property configured with:

  ```
  wsk list
  ```
  
  This shows the packages, actions, triggers and rules currently deployed in your OpenWhisk namespace.

1. Create the action, trigger and rule using the script from the root directory of the application:

  ```
  ./deploy.sh --install
  ```

  Note: the script can also be used to *--uninstall* the OpenWhisk artifacts to
  *--update* the artifacts if you change the action code, or simply with *--env*
  to show the environment variables set in **local.env**.
  
At this point, every new commit in the GitHub repository will trigger the generation action.
The action will call Jekyll and publish the results to Object Storage.

To validate it is working as expected:

1. Start monitoring the OpenWhisk activation log with:

  ```
  wsk activation poll
  ```
  
1. Commit a change in the GitHub repository monitored by OpenWhisk.

1. Wait for the generator action being triggered.

1. Once it completes, access your Object Storage container, through its dashboard in the Bluemix console
or directly through its public Internet URL. The Object Storage public URL looks like
https://dal.objectstorage.open.softlayer.com/v1/AUTH_[projectId]/[container]
(or https://lon.objectstorage.open.softlayer.com/v1/AUTH_[projectId]/[container]
if you're using the London Bluemix region).

  Note: based on our Jekyll theme, the website may not render correctly yet, simply because
  some themes will be using absolute paths in their html like */css/main.css* in a default Jekyll app.
  The next steps will take of this.
  
### Deploy the nginx app

When publishing the generated website, the action made the Object Storage container public
so that it can be accessed on the public Internet.

The goal of the nginx app is to make the Object Storage container available under the mybluemix.net domain
and from there it also gives you the option to make it available through your own custom domain,
and ultimately through a content delivery network.

The app uses the [Cloud Foundry static buildpack](https://github.com/cloudfoundry/staticfile-buildpack.git) to achieve this.
This buildpack runs the high performance [nginx web server](http://nginx.org/) behind the scene.

The app provides a custom nginx configuration file, its only purpose being to proxy the http(s) requests to the Object Storage container.

1. Change to the **proxyapp** directory.

1. Open the **manifest.yml** and update the *host* variable to something unique.

1. Push the application to Bluemix but do not start it just yet

  ```
  cf push --no-start
  ```

1. Define a new environment variable for the application, pointing to the Object Storage container

  ```
  cf set-env openwhisk-publisher-proxy OBJECT_STORAGE_URL https://dal.objectstorage.open.softlayer.com/v1/AUTH_[projectId]/[container]
  ```
  
  Make sure to update the URL to match your Object Storage settings.
  
1. Start the application

  ```
  cf start openwhisk-publisher-proxy
  ```

1. Access the application URL. It serves the generated files stored in the Object Storage container.

  Note: the previous issue about the rendering should be fixed now as */css/main.css* is now served correctly by our proxy app.

## Code Structure

### OpenWhisk - Deployment script

| File | Description |
| ---- | ----------- |
|[**deploy.sh**](deploy.sh)|Helper script to install, uninstall, update the OpenWhisk trigger, actions, rules.|

### OpenWhisk - Change listener

| File | Description |
| ---- | ----------- |
|[**changelistener.js**](changelistener.js)|Processes GitHub push events and calls the right actions.|

### OpenWhisk - Jekyll generator

The **jekyll generator** runs as a Docker action created with the [OpenWhisk Docker SDK](https://console.ng.bluemix.net/docs/openwhisk/openwhisk_reference.html#openwhisk_ref_docker):
  * It uses the Ruby base image.
  * It includes jekyll and the Openstack swift client
  * It is written as a simple shell script.

| File | Description |
| ---- | ----------- |
|[**Dockerfile**](jekyll-generator/Dockerfile)|Docker file to build the extractor image. It pulls ffmpeg into the image together with node. It also runs npm install for both the server and client.|
|[**generate.sh**](jekyll-generator/client/generate.sh)|The core of the action. Retrieves the repo zipball, calls jekyll and uploads to Object Storage.|
|[**service.js**](jekyll-generator/server/src/service.js)|Adapted from the OpenWhisk Docker SDK to call the generate.sh script.|

### Proxy app

| File | Description |
| ---- | ----------- |
|[**nginx.conf**](proxyapp/nginx.conf)|Proxies http(s) calls to the URL configured through OBJECT_STORAGE_URL environment variable.|

## References

* [Jekyll](https://jekyllrb.com/)
* [Jekyll Configuration](https://jekyllrb.com/docs/configuration/)
* [Hugo](https://gohugo.io/)
* [Distribute static content with Object Storage](https://community.runabove.com/kb/en/object-storage/how-to-distribute-static-content-with-object-storage.html)
* [GitHub Webhook](https://developer.github.com/v3/activity/events/types/#pushevent)

## Contribute

Please create a pull request with your desired changes.

## Troubleshooting

### OpenWhisk

Polling activations is a good start to debug the OpenWhisk action execution. Run
```
wsk activation poll
```
and commit a change to the GitHub repository hosting your Jekyll files.

### Web application

Use
```
cf logs <appname>
```
to look at the live logs for the nginx application

## License

See [License.txt](License.txt) for license information.

[bluemix_signup_url]: https://console.ng.bluemix.net/?cm_mmc=GitHubReadMe
