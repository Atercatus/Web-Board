const express = require('express');
const router = express.Router();
const modelService = require('../Services/user_service');
const User = modelService.getUser();
const util = require("../util");

// index
router.get("/", util.isLoggedin, function (req, res) {
    User.find({})
        .sort({ username: 1 })
        .exec(function (err, users) {
            if (err) return res.json(err);
            res.render("users/index", { users: users });
        });
});

// New
router.get('/new', function (req, res) {
    // create 에서 오류 발생 시 기존 코드 및 에러 출력을 위해
    let user = req.flash('user')[0] || {};
    let errs = req.flash('errs')[0] || {};
    res.render('users/new', { user: user, errs: errs });
});

// create
router.post("/", function (req, res) {
    User.create(req.body, function (err, user) {
        if (err) {
            req.flash("user", req.body);
            req.flash("errs", util.parseError(err)); // 1. userSchema의 validation ; 2. db에서 오류 (두 개의 상이한 err 객체 형식이 다름))
            return res.redirect("/users/new"); // back
        }
        //res.redirect("/users");
        res.redirect("/login");
    });
});

// show
router.get("/:username", util.isLoggedin, function (req, res) {
    User.findOne({ username: req.params.username }, function (err, user) {
        if (err) return res.json(err);
        res.render("users/show", { user: user });
    });
});

// edit
router.get("/:username/edit", util.isLoggedin, checkPermission, function (req, res) {
    let user = req.flash("user")[0];
    let errs = req.flash("errs")[0] || {};
    //console.log(errs);

    if (!user) {
        User.findOne({ username: req.params.username }, function (err, user) {
            if (err) return res.json(err);
            res.render("users/edit", { username: req.params.username, user: user, errs: errs });
        });
    }
    else {
        res.render("users/edit", { username: req.params.username, user: user, errs: errs });
    }
});

// update
router.put("/:username", util.isLoggedin, checkPermission, function (req, res, next) {
    User.findOne({ username: req.params.username })
        .select("password") // 미리 false 처리 해두었음 (노출을 줄이기 위해)
        .exec(function (err, user) {
            if (err) res.json(err);

            user.originalPassword = user.password;
            user.password = req.body.newPassword ? req.body.newPassword : user.password;

            for (let val in req.body) {
                user[val] = req.body[val];
            }

            // save update info
            user.save(function (err, user) {
                if (err) {
                    req.flash("user", req.body);
                    req.flash("errs", util.parseError(err));
                    return res.redirect("/users/" + req.params.username + "/edit");
                }
                res.redirect("/users/" + req.params.username);
            });
        });
});

module.exports = router;

// private
function checkPermission(req, res, next){
    User.findOne({username:req.params.username}, function(err, user){
        if(err) {
            res.render("errors/err", {err: err});
        }
        if(user.id != req.user.id)
            return util.noPermission(req, res);
    });
}
