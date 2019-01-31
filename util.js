let util = {};

// 모든 라우터 공용
util.isLoggedin = function(req, res, next){
    if(req.isAuthenticated()){
        next();
    }
    else{
        req.flash("errs", {login:"Please login first"});
        req.originalUrl = req.originalUrl.replace(/comments(.*)/, "");
        console.log(req.originalUrl);
        res.redirect(`/login?origin=${req.originalUrl}`);
    }
}

util.noPermission = function(req, res){
    req.flash("errs", {login: "You don't have permission"});
    /*
    req.logout();
    res.redirect('/login');
    */
    res.redirect('/welcome');
}

util.parseError = function(err) {
    let parsed = {};

    if (err.name == "ValidationError") {
        for (let name in err.errors) {
            let validationError = err.errors[name];
            parsed[name] = {msg:validationError.message};
            console.log(name);
            console.log(parsed[name]);
        }
    }
    // 11000: mongoDB unique error code
    else if (err.code == "11000" && err.errmsg.indexOf("username") > 0) {
        parsed['username'] = {msg:"This username already exists"};
    }
    else {
        parsed.unhandled = JSON.stringify(err);
    }

    return parsed;
}

util.getDate = function(dateObj){
    if(dateObj instanceof Date)
        return dateObj.getFullYear() + "-" + get2digits(dateObj.getMonth() + 1) + "-" + get2digits(dateObj.getDate());
}

util.getTime = function(dateObj){
    if(dateObj instanceof Date)
        return get2digits(dateObj.getHours()) + ":" + get2digits(dateObj.getMinutes()) + ":" + get2digits(dateObj.getSeconds());
}

module.exports = util;

function get2digits(num){
    return ("0" + num).slice(-2);
}