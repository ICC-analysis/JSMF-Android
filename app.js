var express = require('express');
var app = express();
//app.set('views', __dirname + '/views'); //default
app.set('view engine', 'ejs');
app.engine('.html', require('ejs').renderFile);

//configure the static content (bower components).
app.use(express.static(__dirname + '/views'));
app.use('/bower_components',  express.static(__dirname + '/bower_components'));


app.get('/', function (req, res) {
 res.render('index.html');
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
