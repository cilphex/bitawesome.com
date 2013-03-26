// Added by Craig 4/10/2012

var routes = require('../routes');

var paths_to_routes = {
    '/': routes.index,
    //'/where': routes.where,
    //'/drawings': routes.drawings,
    
    // Sandbox
    '/sandbox': routes.sandbox,
    '/sandbox/:path': routes.sandbox
};

exports.setupRoutes = function(app) {
    // Setup regular routes
    for (var path in paths_to_routes) {
        app.get(path, paths_to_routes[path]);
    }
    // Setup errors - doesn't work with newest version of express?
    //app.error(routes.error);
};
