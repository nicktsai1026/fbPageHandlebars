const passport = require('passport');

module.exports = function (app, db) {
    
    function isLoggedIn(req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        console.log('Not logged in')
        res.redirect('/facebookLogin');
    }

    app.get('/login', isLoggedIn, (req, res) => {
        res.redirect('/home');
    })

    app.get('/facebookLogin', (req, res) => {
        console.log('Logging in!')
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