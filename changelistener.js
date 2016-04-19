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
  
  // and call our Jekyll publisher
  whisk.invoke({
    name: "/" + doc.targetNamespace + "/publisher/jekyll",
    parameters: {
      archive: archiveUrl
    },
    blocking: false,
    next: function (error, activation) {
      if (error) {
        console.log("[error]", error);
      } else {
        console.log("[activation]", activation);
      }
      whisk.done(undefined, error);
    }
  });
  
  return whisk.async();
}