//------------------------------------------------------------------------------
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//------------------------------------------------------------------------------
function main(doc) {
  // Format of the GitHub archive_url:
  // 'https://api.github.com/repos/l2fprod/jekyll-test/{archive_format}{/ref}',

  // We download the ZIP archive for the new commit revision
  var archiveUrl = doc.repository.archive_url.replace("{archive_format}", "zipball").replace("{/ref}", "/" + doc.after);
  console.log("Triggering generation of", archiveUrl);

  const openwhisk = require('openwhisk');
  const whisk = openwhisk({ignore_certs: true});

  return new Promise(function(resolve, reject) {
    // and call our Jekyll publisher
    whisk.actions.invoke({
      actionName: "publisher/jekyll",
      params: {
        archive: archiveUrl
      },
      blocking: false
    }).then(function(result) {
      console.log('[OK]', result);
      resolve({ok: true});
    }).catch(function(error) {
      console.log('[KO]', error);
      reject(error);
    });
  });
}
