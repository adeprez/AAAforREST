var http  = require('http');
var querystring = require('querystring');
var email = require('emailjs/email');
var uuid = require('uuid');
var fs = require('fs');


var config = JSON.parse(fs.readFileSync('../conf/config_reset.json', 'UTF-8'));
var auth = config.admin_login + ':' + config.admin_password;
var email_content = fs.readFileSync('email.html', 'UTF-8');

var server = email.server.connect({
   user: config.smtp_user,
   password: config.smtp_password,
   host: config.smtp_host
});

function buildEmail(user, failure) {
  var email_uuid = uuid.v4();
  user.reset_password_uuid = email_uuid;
  var put = http.request({
    method: 'PUT',
    hostname: config.db_hostname,
    port: config.db_port,
    path: '/_users/' + user._id,
    auth: auth
  }, function(res) {
    var login = user._id.split(':')[1];
    var link = config.proxy_reset_url + '?uuid=' + email_uuid;
    var text = 'Your login: ' + login + '\nReset your password here: ' + link;
    sendEmail(user.email, text, email_content.replace('%LOGIN', login).replace('%LINK', link));
  });
  put.on('error', function(e) {
    failure(500, e.message);
  });
  put.write(JSON.stringify(user));
  put.end();
}

function findUsers(email, success, failure) {
  try {
    http.get({
      hostname: config.db_hostname,
      port: config.db_port,
      path: '/_users/_design/aaaforrest/_view/byEmail?limit=20&reduce=false&include_docs=true&key="' + email + '"',
      auth: auth
    }, function(res) {
      var body = '';
      res.on('data', function(chunk) {
        body += chunk;
      });
      res.on('end', function() {
        var users = JSON.parse(body).rows;
        if(users !== undefined && users.length > 0) {
          for(var i = 0; i < users.length; ++i) {
            buildEmail(users[i].doc, failure);
          }
          success();
        } else {
          failure(404, 'No user found with ' + email + ' email');
        }
      });
    });
  } catch(err) {
    failure(500, err);
  }
}

function sendEmail(email, text, content) {
  console.log(text);
  server.send({
    text: text,
    from: config.email_from, 
    to: email,
    subject: 'Reset your password',
    attachment: [{data: content, alternative: true}]
  }, function(err, message) {
    if(err) {
      console.log(err);
    }
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
  processPost(req, res, function() {
    var email = req.post.email;
    if(email) {
      findUsers(email, function() {
        res.end('ok');
      }, function(code, message) {
        res.writeHead(code, {'Content-Type': 'text/plain'});
        res.end(message);
      });
    } else {
      res.writeHead(404, {'Content-Type': 'text/plain'});
      res.end('Email not found');
    }
  });
}).listen(config.port);

console.log('Started');