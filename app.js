var express = require('express'),
	partials = require('express-partials'),
	stylus = require('stylus'),
	router = require('./config/router.js');

//var app = module.exports = express.createServer(express.logger());
var app = express();

app.use(partials());

// Configuration

app.configure(function(){
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    
    // ... your middleware here
    app.use(stylus.middleware({
        src: __dirname + '/views',
        dest: __dirname + '/public',
        compile: function(str, path) {      // optional, but recommended
            return stylus(str)
        		.set('filename', path)
        		.set('warn', true)
        		.set('compress', true);
    	}
    }));
    
    app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// End config

/*app.get('/', function(request, response) {
  response.send('Hello World!');
});*/

router.setupRoutes(app);

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});