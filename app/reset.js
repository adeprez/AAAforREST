var http  = require('http');
var querystring = require('querystring');
var url = require('url');
var fs = require('fs');


var config = JSON.parse(fs.readFileSync('../conf/config_reset.json', 'UTF-8'));
var auth = config.admin_login + ':' + config.admin_password;

function updateUser(res, user) {
  var put = http.request({
    method: 'PUT',
    hostname: config.db_hostname,
    port: config.db_port,
    path: '/_users/' + user._id,
    auth: auth
  }, function(result) {
    var body = '';
    result.on('data', function(chunk) {
      body += chunk;
    });
    result.on('end', function() {
      if(JSON.parse(body).ok) {
        res.end('ok');
      } else {
        res.end('Password update fail');
      }
    });
  });
  put.on('error', function(e) {
    res.writeHead(500, {'Content-Type': 'text/plain'});
    res.end('Update error: ' + e);
  });
  put.write(JSON.stringify(user));
  put.end();
}

function findUser(req, res) {
  var uuid = req.post.uuid;
  http.get({
    hostname: config.db_hostname,
    port: config.db_port,
    path: '/_users/_design/aaaforrest/_view/byResetPasswordUuid?limit=20&reduce=false&include_docs=true&key="' + uuid + '"',
    auth: auth
  }, function(result) {
    var body = '';
    result.on('data', function(chunk) {
      body += chunk;
    });
    result.on('end', function() {
      var data = JSON.parse(body).rows;
      if(data.length > 0) {
        var user = data[0].doc;
        delete user.reset_password_uuid;
        user.password = req.post.password;
        updateUser(res, user);
      } else {
        res.end('Document not found');
      }
    });
  });
}

function processPost(req, res, callback) {
	var queryData = '';
  req.on('data', function(data) {
    queryData += data;
    if(queryData.length > 1e6) {
      queryData = '';
      res.writeHead(413, {'Content-Type': 'text/plain'}).end();
      req.connection.destroy();
    }
  }).on('end', function() {
    req.post = querystring.parse(queryData);
    callback(req, res);
  });
}

http.createServer(function(req, res) {
  processPost(req, res, findUser);
}).listen(config.port);

console.log('Started');