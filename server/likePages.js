const axios = require('axios');

function pageDetails (path) {
    return new Promise((resolve, reject) => {
        var pageData = [];
        var count = 1;
        getDetail(path) 
        function getDetail (path) {
            axios.get(path)
                .then((res) => {
                    if (res.data.paging == null) {
                        pageData.join(',');
                        console.log('last page is empty');
                        return pageData;
                    }
                    pageData = pageData.concat(res.data.data)
                    var nextPage = res.data.paging.next;
                    if (nextPage == null) {
                        pageData.join(',');
                        console.log('done');
                        return pageData
                    } else {
                        // console.log(nextPage);
                        getDetail(nextPage)
                    }
                })
                .then((data) => {
                    if (data != undefined) {
                        var pageIdArr = [];
                        data.forEach((val) => {
                            pageIdArr.push(val.id);
                        })
                        var doubleArr = [];
                        doubleArr.push(data,pageIdArr);
                        resolve(doubleArr)
                    }
                })
                .catch((err) => {
                    console.log(err);
                })
        }
    })
}


module.exports.pageDetails = pageDetails;
