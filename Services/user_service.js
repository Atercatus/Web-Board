const User = require('../models/user');
const Post = require('../models/post');

let modelService = {};

modelService.getUser = function(){
    return User;
}

modelService.getPost = function(){
    return Post;
}

module.exports = modelService;