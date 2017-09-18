const axios = require('axios');
const getLikePages = require('../likePages');
//const GetUser = require('./getUserdb');

module.exports = function (app, db) {
    //const getUser = new GetUser(app, db);
    app.get('/setLikePages', (req, res) => {
        var userId = req.session.passport.user;
        db.collection('users').findOne({ fbId : userId }, (err, item) => {
            if (err) return console.log(err)
            var accessToken = item.access_token ;
            var path = `https://graph.facebook.com/v2.10/${userId}/likes?fields=name,fan_count,category,about,link,picture&access_token=${accessToken}`;
            getLikePages.pageDetails(path)
                .then((details) => {
                    //check user likes page (for existed users)
                    var newPageIdOnly = details[1];
                    if(item.likes) {
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
        db.collection('users').findOne({ fbId: userId}, (err,item) => {
            if (err) return console.log(err)
            item.likes.forEach((val) => {
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
        })
        res.redirect('/home');
    })

    app.get('/home', (req, res) => {
        var userId = req.session.passport.user;
        db.collection('users').findOne({ fbId: userId }, (err, item) => {
            var personalInfoArr= [];
            if (err) return console.log(err)
            personalInfoArr.push(item);
            //set category obj
            var categoryArr = [];
            item.likes.forEach((val) => {
                categoryArr.push(val.category);
            })
            //count category
            var categoryCounts = {};
            categoryArr.forEach(function (x) {
                categoryCounts[x] = (categoryCounts[x] || 0) + 1;
            });
            var alphabetOrder = {}
            Object.keys(categoryCounts).sort()
                .forEach(function(category, i) {
                    alphabetOrder[category] = categoryCounts[category]
                });
            categoryCounts.fbInfo = personalInfoArr;
            res.render('home', {
                profile: item,
                category: alphabetOrder
            });
        })
    })

    // app.get('/likedPage', (req, res) => {
    //     // var userId = req.session.passport.user;
    //     var userId = '1808586925832988';
    //     db.collection('users').findOne({ fbId: userId }, (err, item) => {
    //         if (err) return console.log(err)
    //         var pageArr = item.likes;
    //         var categoryArr = [];
    //         pageArr.forEach((val) => {
    //             categoryArr.push(val.category);
    //         })
    //         var categoryCounts = {};
    //         //count category
    //         categoryArr.forEach(function (x) {
    //             categoryCounts[x] = (categoryCounts[x] || 0) + 1;

    //         });
    //         res.send(categoryCounts);
    //     })
    // })


    app.get('/checkSamePages', (req, res) => {
        db.collection('pagedetails').find({}).toArray((err, item) => {
            var pageArr = [];
            item.forEach((val) => {
                var checkArr = val.fbUserId;
                if(checkArr != null && checkArr.length > 1) {
                    pageArr.push(val);
                }
            })
            // console.log(pageArr);
        })
    })

    app.get('/morris', (req, res) => {
        var counter = 0;
        db.collection('users').findOne({ fbId: '10155438871243820'}, (err, item) => {
            item.likes.forEach((val)=>{
                counter++;
            })
            console.log(counter);
        })
    })
}
