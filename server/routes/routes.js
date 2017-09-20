const axios = require('axios');
const getLikePages = require('../likePages');
//const GetUser = require('./getUserdb');

module.exports = function (app, db) {
    //const getUser = new GetUser(app, db);
    app.get('/setLikePages', (req, res) => {
        var userId = req.session.passport.user;
        db.collection('users').findOne({ fbId: userId }, (err, item) => {
            if (err) return console.log(err)
            var accessToken = item.access_token;
            var path = `https://graph.facebook.com/v2.10/${userId}/likes?fields=name,fan_count,category,about,link,picture&access_token=${accessToken}`;
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
            db.collection('users').updateOne({ fbId: userId }, { $set: { totalPage: pageCounter }}, (err, item) => {
                if (err) return console.log(err);
            })
        })
        res.redirect('/home');
    })

    app.get('/home', (req, res) => {
        var userId = req.session.passport.user;
        db.collection('users').findOne({ fbId: userId }, (err, item) => {
            if (err) return console.log(err)
            var categoryArr = [];
            item.likes.forEach((val) => {
                categoryArr.push(val.category);
            })
            var categoryCounts = {}; //count category
            categoryArr.forEach(function (x) {
                categoryCounts[x] = (categoryCounts[x] || 0) + 1;
            });

            var allCounts = []
            Object.keys(categoryCounts).forEach(function(key) {
                allCounts.push([key,categoryCounts[key]])
            });

            function Comparator(a, b) {
                if (a[1] < b[1]) return 1;
                if (a[1] > b[1]) return -1;
                return 0;
              }
            allCounts = allCounts.sort(Comparator);

            res.render('home', {
                profile: item,
                category: allCounts
            });
        })
    })

    app.get('/checkFriends', (req, res) => {
        var userId = req.session.passport.user;
        db.collection('users').findOne({ fbId: userId}, (err, item) => {
            var friendObj = {};
            var personalInfoArr = [];
            personalInfoArr.push(item);
            friendObj.profile = personalInfoArr;
            let accessToken = item.access_token;
            var path = `https://graph.facebook.com/v2.10/${userId}/friends?access_token=${accessToken}`;
            axios.get(path)
            .then((response) => {
                var friendsArr = response.data.data;
                var friendDetailArr = [];
                var counter = 0;
                friendsArr.forEach((val) => {
                    db.collection('users').findOne({ fbId: val.id }, (err, item) => {
                        friendDetailArr.push(item);
                        counter++;
                        if(counter == friendsArr.length) {
                            friendObj.friendInfo = friendDetailArr;
                            res.render('friends', friendObj);
                        }
                    })
                })
            })
            .catch((err) => {
                console.log(err);
            })
        })
    })

    app.get('/friends/commonpages/:id', (req, res) => {
        var friendId = req.params.id;
        var userId = req.session.passport.user;
        db.collection('users').findOne({ fbId: userId }, (err, userItem) => {
            var commonObj = {};
            commonObj.profile = userItem;
            db.collection('pagedetails').find({}).toArray((err, item) => {
                var commonArr = [];
                item.forEach((val) => {
                    var checkArr = val.fbUserId;
                    if (checkArr.indexOf(userId) > -1 && checkArr.indexOf(friendId) > -1) {
                        commonArr.push(val);
                    }
                })
                commonObj.commonPages = commonArr;
                res.render('common', commonObj);
            })
        }) 
    })

    app.get('/category/:item', (req, res) => {
        var categoryName = req.params.item;
        var userId = req.session.passport.user;
        db.collection('users').findOne({ fbId: userId }, (err, item) => {
            var showCategoriesArr = [];
            var counter = 0;
            item.likes.forEach((val) => {
                counter++;
                if (val.category == categoryName) {
                    if (item.favor != null) {
                        var judge = item.favor.indexOf(val.id);
                        if(judge >= 0) {
                            val.favor = 'like';
                        } else {
                            val.favor = 'unlike';
                        }
                    } else {
                        val.favor = 'unlike';
                    }
                    showCategoriesArr.push(val);
                }
                if(counter == item.likes.length) {
                    var showCategoriesObj = {};
                    showCategoriesObj.profile = item;
                    showCategoriesObj.selectedCategory = showCategoriesArr;
                    res.render('personalLikePages', showCategoriesObj);
                }
            })
        }) 
    })

    app.get('/category/:item/:item', (req, res) => {
        var userId = req.session.passport.user;
        var path = req.originalUrl;
        var categoryName = path.replace('/category/', '').replace('%20', ' ');
        db.collection('users').findOne({ fbId: userId }, (err, item) => {
            var showCategoriesArr = [];
            var counter = 0;
            item.likes.forEach((val) => {
                counter++;
                if (val.category == categoryName) {
                    if (item.favor != null) {
                        var judge = item.favor.indexOf(val.id);
                        if (judge >= 0) {
                            val.favor = 'like';
                        } else {
                            val.favor = 'unlike';
                        }
                    } else {
                        val.favor = 'unlike';
                    }
                    showCategoriesArr.push(val);
                }
                if (counter == item.likes.length) {
                    var showCategoriesObj = {};
                    showCategoriesObj.profile = item;
                    showCategoriesObj.selectedCategory = showCategoriesArr;
                    res.render('personalLikePages', showCategoriesObj);
                }
            })
        })
    })

    app.post('/addFavorite', (req, res) => {
        var favorId = req.body.addFavorId;
        var userId = req.session.passport.user;
        db.collection('users').findOne({ fbId: userId }, (err, item) => {
            if(item.favor == null) {
                db.collection('users').updateOne({ fbId: userId }, { $set: { favor: [favorId] }}, (err, item) => {
                    if (err) return console.log(err)
                })
            } else {
                var favorArr = item.favor;
                var judge = favorArr.indexOf(favorId);
                if (judge >= 0) {
                    favorArr.splice(judge, 1);
                    db.collection('users').updateOne({ fbId: userId }, { $set: { favor: favorArr }}, (err, item) => {
                        if (err) return console.log(err);
                    })
                } else {
                    favorArr.push(favorId);
                    db.collection('users').updateOne({ fbId: userId }, { $set: { favor: favorArr } }, (err, item) => {
                        if (err) return console.log(err);
                    })
                }
            }
        })
    })


}
