const express = require('express');
const router = express.Router();
const modelService = require('../Services/user_service');
const mongoose = require('mongoose');
const Post = modelService.getPost();
const User = modelService.getUser();
const util = require('../util');
const async = require('async');

// index
router.get('/', function (req, res) {
    if (req.query.page === undefined)
        req.query.page = 1;

    // pagination
    let page = Math.max(1, req.query.page);
    let limit = 10;

    // search
    const search = createSearch(req.query);

    async.waterfall([
        function (callback) {
            if (!search.findUser)
                return callback(null);

            User.find(search.findUser)
                .exec(function (err, users) {
                    if (err)
                        return callback(err);

                    let or = [];
                    users.forEach(function (user) {
                        or.push({ author: mongoose.Types.ObjectId(user._id) });
                    });
                    if (search.findPost.$or) {
                        search.findPost.$or = search.findPost.$or.concat(or);
                    }
                    else if (or.length > 0) {
                        search.findPost = { $or: or };
                    }
                    callback(null);
                });
        },
        function (callback) {
            console.log(search.findPost);

            if (search.findUser && !search.findPost.$or) {
                return callback(null, 0, 0);
            }

            // search.findPost; 검색 조건
            Post.countDocuments(search.findPost)
                //.populate("author")
                .exec(function (err, cnt) {
                    console.log(cnt);
                    if (err) return res.json({ success: false, msg: err });
                    let skip = (page - 1) * limit;
                    let maxPage = Math.ceil(cnt / limit); // 크거나 같은 숫자
                    callback(null, skip, maxPage);
                    // null -> tasks(An array of functions to run)
                });
        },
        function (skip, maxPage, callback) {
            if (search.findUser && !search.findPost.$or) {
                return callback(null, [], 0);
            }

            // search.findPost: 검색 조건
            Post.find(search.findPost)
                .populate("author") // author의 ObjectId가 실제 객체로 치환 // author에 입력되어있는 user id로 부터 실제 user의 값을 author에 생성
                .sort("-createdAt") // desc ({createdAt:-1})
                .skip(skip)
                .limit(limit)
                .exec(function (err, posts) {
                    if (err)
                        callback(err);

                    callback(null, posts, maxPage);
                });
        },
        function (posts, maxPage) {
            return res.render("posts/index", {
                posts: posts, page: page, maxPage: maxPage, urlQuery: req._parsedUrl.query, search: search
            });
        },
        function (err, result) {

        }
    ]);
});

// new
router.get("/new", util.isLoggedin, function (req, res) {
    let post = req.flash('post')[0] || {};
    //let errors = req.flash("errors")[0] || util.initPostErr();
    let errs = req.flash("errs")[0] || {};
    res.render("posts/new", { post: post, errs: errs });
});

// create
router.post("/", util.isLoggedin, function (req, res) {
    req.body.author = req.user._id;
    Post.create(req.body, function (err, post) {
        if (err) {
            req.flash("post", req.body);
            req.flash("errs", util.parseError(err));
            return res.redirect("/posts/new");
        }
        res.redirect('/posts');
    });
});

// show
router.get("/:id", function (req, res) {
    // search
    const search = createSearch(req.query);
    let errs = req.flash('errs')[0] || {};

    Post.findOne({ _id: req.params.id })
        .populate(["author", "comments.author"])
        .exec(function (err, post) {
            if (err) return res.json({ success: false, message: err });
            post.views++;
            post.save();
            res.render("posts/show", { post: post, urlQuery: req._parsedUrl.query, search: search, errs: errs, util: util });
        });
});

//edit
router.get("/:id/edit", util.isLoggedin, checkPermission, function (req, res) {
    let post = req.flash('post')[0];
    //let errors = req.flash('errors')[0] || util.initPostErr();
    let errs = req.flash('errs')[0] || {};
    if (!post) {
        Post.findOne({ _id: req.params.id }, function (err, post) {
            if (err) {
                res.render('errors/err', { err: err });
            }
            res.render('posts/edit', { post: post, errs: errs });
        });
    }

    else {
        post._id = req.params.id;
        res.render("posts/edit", { post: post, errs: errs });
    }
});

//update
// {runValidators :true} => schema에 있는 validation 작동되게 함
router.put('/:id', util.isLoggedin, checkPermission, function (req, res) {
    req.body.updatedAt = Date.now();
    Post.findOneAndUpdate({ _id: req.params.id }, req.body, { runValidators: true }, function (err, post) {
        if (err) {
            req.flash("post", req.body);
            req.flash("errs", util.parseError(err));

            return res.redirect("/posts/" + req.params.id + "/edit");
        }
        res.redirect('/posts/' + req.params.id);
    });
});

// delete
router.delete('/:id', util.isLoggedin, checkPermission, function (req, res) {
    Post.remove({ _id: req.params.id }, function (err) {
        if (err) return res.json(err);
        res.redirect('/posts');
    });
});

// comments
// create
router.post('/:id/comments', util.isLoggedin, function (req, res) {
    req.body.author = req.user._id;

    // update에서 validation을 하려면 option에 runValidators를 꼭 넣어준다.!!
    Post.updateOne({ _id: req.params.id }, { $push: { comments: req.body }}, {runValidators: true} , function(err, post){
        if(err){
            req.flash('errs', util.parseError(err));
            return res.redirect('/posts/' + req.params.id);
        }

        res.redirect('/posts/' + req.params.id + '?' + req._parsedUrl.query);
    });
});

// delete
router.delete('/:postId/comments/:commentId', util.isLoggedin, function (req, res) {
    Post.findOneAndUpdate({ _id: req.params.postId }, { $pull: { comments: { _id: req.params.commentId } } },
        function (err, post) {
            if (err)
                return res.json({ success: false, message: err });

            res.redirect('/posts/' + req.params.postId + '?' + req._parsedUrl.query.replace(/_method=(.*?)(&|$)/ig, ""));
        });
});


module.exports = router;

// private
function checkPermission(req, res, next) {
    Post.findOne({ _id: req.params.id }, function (err, post) {
        if (err)
            res.render("errors/err", { err: err });
        if (post.author != req.user.id)
            return util.noPermission(req, res);

        next();
    });
}

function createSearch(query) {
    let findPost = {};
    let findUser = null;
    let highlight = {};

    if (query.searchType && query.searchText && query.searchText.length >= 2) {
        let searchTypes = query.searchType.toLowerCase().split(",");
        let postQueries = [];

        if (searchTypes.indexOf("title") >= 0) {
            // i(ignore): 대소문자 구분X
            postQueries.push({ title: { $regex: new RegExp(query.searchText, 'i') } });
            highlight.title = query.searchText;
        }
        if (searchTypes.indexOf("body") >= 0) {
            postQueries.push({ body: { $regex: new RegExp(query.searchText, 'i') } });
            highlight.body = query.searchText;
        }
        if (searchTypes.indexOf("author") >= 0) {
            findUser = ({ username: { $regex: new RegExp(query.searchText, 'i') } });
            highlight.author = query.searchText;
        }
        if (postQueries.length > 0)
            findPost = { $or: postQueries };

    }
    return { searchType: query.searchType, searchText: query.searchText, findPost: findPost, findUser: findUser, highlight: highlight };
}