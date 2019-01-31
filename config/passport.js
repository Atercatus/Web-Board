const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const modelService = require('../Services/user_service');
const User = modelService.getUser();

// serialize -> session에 등록
// 찾은 user 정보 어떻게 저장할 지 설정
passport.serializeUser(function (user, done) {
    done(null, user.id);
});

// deserialize -> session에 등록된 user 정보로부터 object 생성
// request 시에 session 에서 어떻게 user object를 만들지 명세
passport.deserializeUser(function (id, done) {
    User.findOne({ _id: id }, function (err, user) {
        //console.log(user)
        done(err, user);
    });
});

// local strategy
passport.use("local-login",
    new LocalStrategy({
        usernameField: "username", // form 항목 이름
        passwordField: "password", // form 항목 이름
        passReqToCallback: true
    },
        function (req, username, password, done) {
            User.findOne({ username: username })
                .select({ password: 1 })
                .exec(function (err, user) {
                    if (err) return done(err);

                    if (user && user.authenticate(password)) {
                        return done(null, user);
                    }
                    else {
                        req.flash("username", username);
                        req.flash("errs", { login: "Incorrect username or password" });
                        return done(null, false);
                    }
                });
        }
));

module.exports = passport;


// LocalStrategy -> (성공시에) serialize -> passport.authenticate -> redirect 
// -> 이후 모든 신호가 deserialize 거침