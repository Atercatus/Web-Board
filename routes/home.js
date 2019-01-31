const express = require("express");
const router = express.Router();
const passport = require('../config/passport');

router.get('/', function (req, res) {
    res.render("home/welcome");
});

router.get('/about', function (req, res) {
    res.render('home/about');
});

router.get('/login', function (req, res) {
    let username = req.flash("username")[0];
    let errs = req.flash("errs")[0] || {};

    if(req.header('Referer').indexOf('login') < 0)
    req.session.returnTo = req.header('Referer');

    res.render("home/login", {
        username: username,
        errs: errs
    });
});

router.post("/login", function (req, res, next) { // 2 callbacks(need 'next')
    let errs = {};
    let username = '';
    let isValid = true;
    if (!req.body.username) {
        isValid = false;
        errs.username = "Username is requied!";
    }
    else {
        username = req.body.username;
    }
    if (!req.body.password) {
        isValid = false;

        errs.password = "Password is required!";
    }
    if (isValid) {
        next();
    }
    else {
        req.flash("username", username);
        req.flash("errs", errs);
        res.redirect("/login");
    }
},
    passport.authenticate("local-login", {
        failureRedirect: '/login'
    }),
    (req, res) => {
        let returnTo = '/'
        if (req.session.returnTo) {
            returnTo = req.session.returnTo;
            delete req.session.returnTo;
        }
        res.redirect(returnTo);
    });

router.get('/logout', function (req, res) {
    req.logout();
    res.redirect(req.header('Referer') || '/');
    if (req.session.returnTo)
        delete req.session.returnTo;
});

module.exports = router;