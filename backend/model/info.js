const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/scrapping');

const info = mongoose.Schema({
    domain : String,
    email : Array,
    contact : Array,
    socialLink : Array,
    techStack : Array,

});

module.exports = mongoose.model('info', info)


