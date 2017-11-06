const passport = require('passport');
const getLikePages = require('../likePages');

module.exports = function (app, db) {

    function isLoggedIn(req, res, next) {
        if (req.isAuthenticated()) {
            console.log('Already logged in!')
            return next();
        }
        res.redirect('/login');
    }

    // module.exports.isLoggedIn = isLoggedIn

    app.get('/', isLoggedIn, (req, res) => {
        res.redirect('/category');
    })

    app.get('/login', (req, res) => {
        //error here
        res.render('login');
    })

    app.get('/auth/facebook',
        passport.authenticate('facebook'));

    app.get('/auth/facebook/callback',
        passport.authenticate('facebook', { failureRedirect: '/login' }),
        function (req, res) {
            // res.redirect('/category');
            res.redirect('/setLikePages');
        }, 
        // on error; likely to be something FacebookTokenError token invalid or already used token,
        // these errors occur when the user logs in twice with the same token
        function(err,req,res,next) {
            // You could put your own behavior in here, fx: you could force auth again...
            // res.redirect('/auth/facebook/');
            if(err) {
                res.status(400);
                res.render('login', {message: err.message});
            }
        }
    );

    app.get('/logout', (req, res) => {
        req.logout();
        res.redirect('/');
    })

    //call api save in database
    app.get('/setLikePages', (req, res) => {
        var userId = req.session.passport.user;
        db.collection('users').findOne({ fbId: userId }, (err, item) => {
            if (err) return console.log(err)
            var accessToken = item.access_token;
            var path = `https://graph.facebook.com/v2.10/${userId}/likes?fields=name,fan_count,category,about,created_time,link,picture&access_token=${accessToken}`;
            getLikePages.pageDetails(path)
                .then((details) => {
                    //check user likes page (for existed users)
                    var newPageIdOnly = details[1];
                    if (item.likes) {
                        var oldPageIdOnly = [];
                        item.likes.forEach((val) => {
                            oldPageIdOnly.push(val.id);
                        })
                        let a = new Set(oldPageIdOnly);
                        let b = new Set(newPageIdOnly);
                        // ab difference set 差集
                        let differenceABSet = new Set([...a].filter(x => !b.has(x)));
                        let differenceArr = Array.from(differenceABSet);

                        differenceArr.forEach((value) => {
                            db.collection('pagedetails').findOne({ id: value }, (err, item) => {
                                var newFbUserId = item.fbUserId.filter(function (id) {
                                    return id != userId;
                                })
                                db.collection('pagedetails').updateOne({ id: value }, { $set: { fbUserId: newFbUserId } }, (err, item) => {
                                    if (err) return console.log(err)
                                })
                            })
                        })
                    }
                    var pageObj = {};
                    pageObj.likes = details[0];
                    db.collection('users').updateOne({ fbId: userId }, { $set: pageObj }, (err, item) => {
                        if (err) return console.log(err)
                        res.redirect('/setPageDetails');
                    })
                })
                .catch((err) => {
                    console.log(err);
                })
        })
        //res.redirect('/setPageDetails');
    })

    app.get('/setPageDetails', (req, res) => {
        var userId = req.session.passport.user;
        db.collection('users').findOne({ fbId: userId }, (err, item) => {
            if (err) return console.log(err)
            var pageCounter = 0;
            item.likes.forEach((val) => {
                pageCounter++;
                db.collection('pagedetails').findOne({ id: val.id }, (err, item) => {
                    if (item == null) {
                        val.fbUserId = [userId];
                        db.collection('pagedetails').insert(val, (err, item) => {
                            if (err) return console.log(err)
                        })
                    } else {
                        //check fbUserId arr had this facebookId or not
                        var judge = item.fbUserId.indexOf(userId);
                        if (judge < 0) {
                            item.fbUserId.push(userId);
                            db.collection('pagedetails').updateOne({ id: val.id }, { $set: item }, (err, item) => {
                                if (err) return console.log(err)
                            })
                        }
                    }
                })
            })
            db.collection('users').updateOne({ fbId: userId }, { $set: { totalPage: pageCounter } }, (err, item) => {
                if (err) return console.log(err);
            })
        })
        res.redirect('/category');
    })

}