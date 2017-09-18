const passport = require('passport');

module.exports = function (app, db) {
    
    function isLoggedIn(req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        res.redirect('/facebookLogin');
    }

    app.get('/login', isLoggedIn, (req, res) => {
        res.render('home');
    })

    app.get('/facebookLogin', (req, res) => {
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