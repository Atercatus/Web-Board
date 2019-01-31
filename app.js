const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const path = require('path');
const flash = require('express-flash');
const session = require('express-session');
const passport = require('./config/passport');

const app = express();
const port = process.env.PORT || 3000;

// connect DB
mongoose.connect('mongodb://localhost:27017/myBoard', {useNewUrlParser: true});

const db = mongoose.connection;

db.once("open", function(){
    console.log("DB connected");
});

db.on("error", function(err){
    console.log("DB ERROR: " + err);
});

app.set('view engine', 'ejs');
app.use(express.static(path.resolve(__dirname, "public")));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(methodOverride("_method"));
// Flash
app.use(session({
    secret:"MySecret",  // 암호화
    resave:true,        // 세션이 수정되지 않은 경우에도 세션 업데이트
    saveUninitialized:true})); // Flash & Session / 초기화되지 않은 세션을 재설정한다
app.use(flash()); // flash를 위해선 session이 필요하므로 순서 중요함
// Passport
app.use(passport.initialize()); // passport 초기화
app.use(passport.session()); // passport를 session과 연결
// Custom Middlewares
app.use(function(req, res, next){
    if(req.path != '/login' && req.session.returnTo){
        delete req.session.returnTo;
    }
    next();
});
app.use(function(req, res, next){
    res.locals.isAuthenticated = req.isAuthenticated(); // passport에서 제공해주는 함수, 현재 로그인 상태 true/false로 반환
    res.locals.currentUser = req.user; // passport에서 추가된 항목, session으로 부터 user를 deserialize
    next();
});

// Routes
app.use("/", require('./routes/home'));
app.use('/posts', require('./routes/posts'));
app.use('/users', require('./routes/users'));

app.listen(port, function(){
    console.log("Express server has started on port " + port); 
});