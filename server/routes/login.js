const passport = require('passport');

module.exports = function (app, db) {
    
    function isLoggedIn(req, res, next) {
        console.log(req._passport.instance._userProperty)
        if (req.isAuthenticated()) {
            return next();
        }
        res.redirect('/login');
    }

    app.get('/', isLoggedIn, (req, res) => {
        res.redirect('/home');
    })

    app.get('/login', (req, res) => {
        //hide the header partials here
        res.render('login');
    })

    app.get('/auth/facebook/callback',
        passport.authenticate('facebook', { failureRedirect: '/login' }),
        function (req, res) {
            res.redirect('/setLikePages');
        });

    app.get('/auth/facebook',
        passport.authenticate('facebook'));
}