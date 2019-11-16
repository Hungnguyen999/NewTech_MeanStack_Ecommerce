const mongoose = require("mongoose");
const bookSchema = new mongoose.Schema({
    name:String,
    image:String,
    file:String,
})
module.exports = mongoose.model("Book",bookSchema);