const mongoose = require('mongoose');
const util = require('../util');

const postSchema = mongoose.Schema({
    title: { type: String, required: [true, "Title is required!"], maxlength: [50, "Please fill in 50characters or less"] }, // 제목
    body: { type: String, required: [true, "Body is required!"], maxlength: [700, "Please fill in 700characters or less"] },    // 본문
    author: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true }, // 작성자, relationship 생성(이 정보는 "user" collection 에서 가져오는 것임을 ref를 통해서 설정)
    file: { type: [String] }, // uploads
    createdAt: { type: Date, default: Date.now },// 작성 날짜
    updatedAt: { type: Date },// 최근 수정 날짜
    views: { type: Number, default: 0 }, // 조회수
    comments: [{
        body: { type: String, required: [true, "Body is required!"] },
        author: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
        createdAt: { type: Date, default: Date.now }
    }]
}, {
        toObject: { virtuals: true } // virtuals 를 view에서 쓰기위해
    });

// virtuals 
postSchema.virtual('createdTime')
    .get(function () {
        return util.getTime(this.createdAt);
    });
postSchema.virtual('createdDate')
    .get(function () {
        return util.getDate(this.createdAt);
    });
postSchema.virtual('updatedDate')
    .get(function () {
        return util.getDate(this.updatedAt);
    });
postSchema.virtual('updatedTime')
    .get(function () {
        return util.getTime(this.updatedAt);
    });

const Post = mongoose.model("post", postSchema);
module.exports = Post;

//module.exports = postSchema;
