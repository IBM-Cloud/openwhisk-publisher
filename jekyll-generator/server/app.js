/**
 * Copyright 2017 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the “License”);
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an “AS IS” BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const bodyParser = require('body-parser');
const express = require('express');

const generator = value => new Promise((resolve) => {
  console.log('[running] value =', value);

  // inject all parameters from the payload as environment variables
  const env = Object.create(process.env);

  const valueAsObject = JSON.parse(value);
  Object.keys(valueAsObject).forEach(function(key) {
    env["OW_PARAM_" + key] = valueAsObject[key];
  });

  const spawn = require('child_process').spawn;
  const proc = spawn('/blackbox/client/generate.sh', [], { env: env });

  let output = '';
  proc.stdout.on('data', (data) => {
    console.log('[stdout] ' + data); // eslint-disable-line prefer-template
    output += data;
  });
  proc.stderr.on('data', (data) => {
    console.log('[stderr] ' + data); // eslint-disable-line prefer-template
    output += data;
  });
  proc.on('close', (code) => {
    console.log('[exit] with code', code);
    const result = {
      result: {
        msg: output
      }
    };
    resolve(result);
  });
});

const invokeGenerator = args => generator(JSON.stringify(args));

const app = express();
app.set('port', 8080);
app.use(bodyParser.json());

const server = app.listen(app.get('port'), () => {
  const host = server.address().address;
  const port = server.address().port;
  console.log('[start] listening at http://%s:%s', host, port);
});

app.post('/init', (req, res) => res.send());
app.post('/run', (req, res) => {
  console.log('[run]', req.body);
  const args = req.body.value;
  invokeGenerator(args).then((result) => {
    res.json(result);
  }).catch((err) => {
    console.log(err);
    res.status(500).json({ error: err });
  });
});
