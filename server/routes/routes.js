const axios = require('axios');
//const GetUser = require('./getUserdb');

module.exports = function (app, db) {
    //const getUser = new GetUser(app, db);
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
                            friendObj.friendInfo = friendDetailArr.sort();
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

    app.get('/friends/commonpages/:id/:name', (req, res) => {
        var friendId = req.params.id;
        var friendName = req.params.name;
        var userId = req.session.passport.user;
        
        var promises = []
        promises.push(db.collection('users').findOne({ fbId: userId }))
        promises.push(db.collection('pagedetails').find({}).toArray())

        Promise.all(promises)
            .then((list)=>{
                var commonObj = {};
                commonObj.profile = list[0]
                commonObj.name = friendName

                var commonArr = [];
                var counter = 0;

                var item = list[1]
                item.forEach((val) => {
                    var checkArr = val.fbUserId;
                    if (checkArr.indexOf(userId) > -1 && checkArr.indexOf(friendId) > -1) {
                        commonArr.push(val);
                        counter++;
                    }
                })
                commonObj.commonPages = commonArr;
                commonObj.pageCounter = counter;
                res.render('common', commonObj);

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
                    showCategoriesObj.categoryName = categoryName;
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
                    showCategoriesObj.categoryName = categoryName;
                    showCategoriesObj.selectedCategory = showCategoriesArr;
                    res.render('personalLikePages', showCategoriesObj);
                }
            })
        })
    })

    app.post('/addFavourite', (req, res) => {
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
                    db.collection('users').updateOne({ fbId: userId }, { $set: { favor: favorArr }}, (err, item) => {
                        if (err) return console.log(err);
                    })
                }
            }
        })
    })

    app.get('/showFavourite', (req, res) => {
        var userId = req.session.passport.user;
        db.collection('users').findOne({ fbId: userId }, (err, item) => {
            if (err) return console.log(err)
            if (item.favor == null || item.favor.length == 0) {
                var nullObj = {};
                nullObj.profile = item;
                nullObj.header = `You don't have any favourite pages. Go add something now!`
                res.render('showFavourite', nullObj);
            }
            else{
                var showFavouriteObj = {};
                showFavouriteObj.profile = item;
                var favouriteArr = [];
                var counter = 0;
                item.favor.forEach((val) => {
                    db.collection('pagedetails').findOne({ id: val }, (err, pageDetailItem) => {
                        if (err) return console.log(err)
                        pageDetailItem.favor = 'like';
                        favouriteArr.push(pageDetailItem);
                        counter++;
                        if(counter == item.favor.length) {
                            showFavouriteObj.showFavouritePages = favouriteArr;
                            showFavouriteObj.header = `Favourite Pages`
                            res.render('showFavourite', showFavouriteObj);
                        }
                    })
                })
            }
        })
    })

    app.get('/checkTimeLine', (req, res) => {
        var userId = req.session.passport.user;
        db.collection('users').findOne({ fbId: userId}, (err, item) => {
            var yearArr = [];
            item.likes.forEach((val) => {
                var pageDate = new Date(val.created_time);
                var pageYearOnly = pageDate.getFullYear();
                yearArr.push(pageYearOnly);
            })
            //count date
            var dateCounts = {}; 
            yearArr.forEach(function (x) {
                dateCounts[x] = (dateCounts[x] || 0) + 1;
            });
            var showYear = [];
            var showNumber = [];
            for (var key in dateCounts) {
                showYear.push([key].toString());
                showNumber.push(dateCounts[key]);
            }
            var timeLineObj = {};
            timeLineObj.years = showYear;
            timeLineObj.number = showNumber;
            timeLineObj.profile = item;
            res.render('timeLine', timeLineObj);
        })
    })

    app.get('/checkMonth', (req, res) => {
        var inputSearch = req.query.year+'-'+req.query.month;
        var userId = req.session.passport.user;
        var searchArr = [];
        db.collection('users').findOne({ fbId: userId }, (err, item) => {
            if (err) return console.log (err)
            var counter = 0;
            item.likes.forEach((val) => {
                var judgeDate = val.created_time.indexOf(inputSearch);
                if (judgeDate > -1) {
                    var judgeFavor = item.favor.indexOf(val.id);
                    if(judgeFavor > -1) {
                        val.favor = 'like';
                        searchArr.push(val);
                    } else {
                        val.favor = 'unlike';
                        searchArr.push(val);
                    }
                }
                counter++;
                if (counter == item.likes.length) {
                    var targetTimeObj = {};
                    targetTimeObj.profile = item;
                    targetTimeObj.pages = searchArr;
                    targetTimeObj.selected = inputSearch;
                    res.render('targetTime', targetTimeObj);
                }
            })
        })
    })

}
