var fs = require('fs');
var spawn = require('child_process').spawn;

function HelloService() {

  var clientProg = "/blackbox/client/generate.sh";
  var server = undefined;

  /**
   * Starts the server.
   *
   * @param app express app
   */
  this.start = function start(app) {
    var self = this;
    server = app.listen(app.get('port'), function() {
      var host = server.address().address;
      var port = server.address().port;
      console.log('[start] listening at http://%s:%s', host, port);
    });
  }

  /**
   * req.body = { main: String, code: String, name: String }
   */
  this.initCode = function initCode(req, res) {
    res.status(200).send(); 
  }

    /**
     * req.body = { value: Object, meta { activationId : int } }
     */
  this.runCode = function runCode(req, res) {
    var meta = (req.body || {}).meta;
    var value = (req.body || {}).value;
    
    console.log("meta=", meta);
    console.log("value=", value);
    
    // inject all parameters from the payload as environment variables
    var env = Object.create(process.env);
    Object.keys(value).forEach(function(key) {
      env["OW_PARAM_" + key] = value[key]; 
    });
    
    if (typeof value != 'string')
      value = JSON.stringify(value);
        
    var proc = spawn(clientProg, [], { env: env });
    var output = ''
    proc.stdout.on('data', function(data) {
      // console.log('stdout: ' + data);
      output += data;
    });
    proc.stderr.on('data', function(data) {
      // console.log('stderr: ' + data);
      output += data;
    });
    proc.on('close', function(code) {
      // console.log('child process exited with code ' + code);
      var result = { 'result' : { 'msg' : output } };
      res.status(200).json(result);
    });
  }

}

HelloService.getService = function() {
  return new HelloService();
}

module.exports = HelloService;
