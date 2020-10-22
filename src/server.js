var http = require('http');
var app = require('./app');
require('dotenv').config();
const port = process.env.PORT || 4000;
const server = http.createServer(app);
console.log('The server is running in ' + port + ' port.');
server.listen(port);