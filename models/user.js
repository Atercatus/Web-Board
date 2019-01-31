const mongoose = require('mongoose');
const bcrypt = require("bcrypt");
const saltRounds = 10;

const userSchema = mongoose.Schema({
    username: {
        type: String,
        required: [true, "Username is required!"],
        match: [/^.{4,12}$/, "Should be 4-12 characters!"],
        trim: true, // white space
        unique: true
    },
    password: {
        type: String,
        required: [true, "Password is required!"],
        select: false
    },
    name: {
        type: String,
        required: [true, "Name is required!"],
        match: [/^.{4,12}$/, "Should be 4-12 characters!"],
    },
    email: {
        type: String,
        // 추가로 . _ % + - 사용가능하다
        match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+[a-zA-Z]{2,}$/, "Should be a valid email address!"],
        trim: true
    }
}, {
        toObject: { virtuals: true }
    });

userSchema.virtual("passwordConfirmation")
    .get(function () { return this._passwordConfirmation; })
    .set(function (value) { this._passwordConfirmation = value });

userSchema.virtual("originalPassword")
    .get(function () { return this._originalPassword; })
    .set(function (value) { this._originalPassword = value; });

userSchema.virtual("currentPassword")
    .get(function () { return this._currentPassword; })
    .set(function (value) { this._currentPassword = value; });

userSchema.virtual("newPassword")
    .get(function () { return this._newPassword; })
    .set(function (value) { this._newPassword = value; });

// \d:digit, {}: 반복, .: 모든 문자열, ?: {0, 1}, x(?=y): x뒤에y가 따라오는 경우, *:0이상 
// 0개 이상의 숫자, 0개 이상의 문자열
//let passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,16}$/; // 최소 하나의 문자 및 숫자 
let passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,16}$/; // 최소 하나의 문자 및 숫자 + 특수 문자 허용
//let passwordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,16}$/;
let passwordRegexErrorMessage = "Should be minimum 8 characters of alphabet and number combination!";

// path: return a SchemaType
userSchema.path("password").validate(function (v) {
    let user = this;

    // create
    if (user.isNew) {
        if (!user.passwordConfirmation) {
            user.invalidate("passwordConfirmation", "Password Confirmation is required!");
            // err.name = 'ValidationError'
        }
        if (!passwordRegex.test(user.password)) {
            user.invalidate("password", passwordRegexErrorMessage);
        }
        else if (user.password !== user.passwordConfirmation) {
            user.invalidate("passwordConfirmation", "Password Confirmation does not matched!");
        }
    }

    // update
    else if (!user.isNew) {
        if (!user.currentPassword) {
            user.invalidate("currentPassword", "Current Password is required!");
        }

        if (user.currentPassword && !bcrypt.compareSync(user.currentPassword, user._originalPassword)) {
            user.invalidate("currentPassword", "Current Password is invalid!");
        }

        if (user.newPassword && !passwordRegex.test(user.newPassword)) {
            user.invalidate("newPassword", passwordRegexErrorMessage);
        }

        else if (user.newPassword !== user.passwordConfirmation) {
            user.invalidate("passwordConfirmation", "Password Confirmation does not matched!");
        }
    }
});

// "save" -> Model.create, Model.save
userSchema.pre("save", function (next) {
    let user = this;
    if (user.isModified("password")) {
        bcrypt.hash(user.password, saltRounds, function (err, hash) {
            if (err) next(err);
            user.password = hash;
            next();
        });
    }
    else {
        next();
    }
});

userSchema.methods.authenticate = function (password) {
    let user = this;

    return bcrypt.compareSync(password, user.password);
}

let User = mongoose.model("user", userSchema);
module.exports = User;