const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    id:String,
    name:String,
    email:String,
    password: String,
}, {collection: 'users'})
// Các phương thức ======================
// Tạo mã hóa mật khẩu
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// kiểm tra mật khẩu có trùng khớp
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};
module.exports = mongoose.model("User",userSchema);