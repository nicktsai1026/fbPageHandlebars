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
        //Redirect to another page for registered users 
    })

    app.get('/facebookLogin', (req, res) => {
        res.render('login');
    })

    app.get('/auth/facebook/callback',
        passport.authenticate('facebook', { failureRedirect: '/login' }),
        function (req, res) {
            console.log(req);
            let userId = req.user.fbId
            db.collection('users').findOne({ fbId : userId }, (err, item) => {
                if (err) return console.log(err)
                //console.log(item.fbId)
                if (item.fbId){
                    console.log('Redirect this user to a registered route')
                    res.redirect('/home/' + token);        
                } else {
                    console.log('This is a new user!')
                    res.redirect('/home/' + token);
                }
            })
        });

    app.get('/auth/facebook',
        passport.authenticate('facebook'));
}