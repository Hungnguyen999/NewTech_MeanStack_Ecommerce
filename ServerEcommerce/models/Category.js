const mongoose = require('mongoose');
const categorySchema = new mongoose.Schema({
    //không cần phải tạo id bởi vì trong mongoose đã tự sinh
    name: String,
    Books_id:[{type:mongoose.Types.ObjectId}], //Không nên để id là string
})
module.exports=mongoose.model("Category",categorySchema);