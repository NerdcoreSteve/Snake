var express = require('express');
var app = express();
var http = require('http');
var httpServer = http.Server(app);

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/'));

app.get('/', function(req, res){
    res.sendFile(__dirname + '/snake.html');
});

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'));
});
