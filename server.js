const express = require('express');
const app = express();
const router = express.Router();
const MongoClient = require('mongodb').MongoClient;
const bodyParser = require('body-parser');
const hb = require('express-handlebars');
const session = require('express-session');
const db = require('./config/db');

app.engine('handlebars', hb({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');

// set secret in config folder
app.set('secret',db.secret);

// view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'ejs'); 
// app.engine('html', require('ejs').renderFile);


const port = 8080;

app.use(bodyParser.urlencoded({ extended: true }));

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

app.use(session({
    secret: 'supersecret',
    resave: true,
    saveUninitialized: true
}));

// use style.css file
app.use('/assets', express.static(__dirname + '/assets'));

MongoClient.connect(db.url, (err, database) => {
    if (err) return console.log(err)
    require('./server/routes')(app, database);
    app.listen(port, () => {
        console.log('We are live on ' + port);
    });
})

// for unit test
module.exports.app = app;