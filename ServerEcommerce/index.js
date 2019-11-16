//LƯU Ý BẤT CỨ CHỈNH SỬA NÀO TRONG INDEX.JS ĐỀU PHẢI RESTART LẠI SERVER NODEJS
var express = require('express');
var app = express();
var https = require('https');
var cors = require('cors');

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy
const passportFacebook = require('passport-facebook').Strategy
const fs = require('fs');
var session = require('express-session');

//Google

var GoogleStrategy = require('passport-google-oauth').OAuthStrategy;

app.set("view engine","ejs");
app.set("views","./views");
app.use(session({
    secret:"NguyenDuyHungs"
}))
//app.use(express.static("public"));


app.get('/login',(req,res)=> res.render("login"))
// app.use(session({ secret:"mysecret",
//                 cookie:{ maxAge:1000*60*5 } 
//                 }));
app.use(passport.initialize());
app.use(passport.session()); // 2 cái này dùng để khởi tạo


app.use('/files',express.static(__dirname + '/public/upload'))
app.use(cors());

app.get('/auth/fb',passport.authenticate('facebook',{ scope: ['email'] })); //passport Facebook . yêu cầu thêm email
app.get('/auth/fb/cb', passport.authenticate('facebook',{ failureRedirect:'/login',successRedirect:'/cate' })); //cb là callback
app.enable("trust proxy");

https.createServer({
    key:fs.readFileSync('./certificate/key.pem'),
    cert:fs.readFileSync('./certificate/certificate.pem')
},app).listen(3000,function(){
    console.log("Run 1 time on port 3000")
});

app.listen(3001,function(){
    console.log("Run 2 time on port 3001")
});
//https://github.com/khoaphp/AngServices/blob/master/NodeServer/index.js
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');  // Khi nào deploy lên server thì chỉ cần thay đường dẫn này bằng ip hoặc domain . 
    //câu lệnh này cho thấy sever của angular được allowed để truy cập vào server của nodejs
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

//boy-parser dùng để up load file
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));



//mongoose 
const mongoose= require('mongoose');
mongoose.connect('mongodb://localhost:27017/Ecommerce',{ useNewUrlParser:true , useUnifiedTopology:true },function(err){
    if(err){
        console.log('MongoDB connection error ');
    }
    else{
        console.log('MongoDB connection successfully ');
    }
});

const Category = require("./models/Category");
const Book = require("./models/Book");
const User = require("./models/User");

let apiConfig = require("./public/config/config.json");
//Viết các api để angular gọi,LUÔN SỬ DỤNG POST
app.post("/api/book",function(req,res){
    Book.find(function(err,items){
        if(err){
            req.json({ kq: false, "err":err });
        }
        else{
            let count = items.length;
            items.forEach(item => {
                item.image = apiConfig.apiFiles + item.image; // http:lcoagdsdnj + ten file
                count--;
                if(count==0)
                    res.json(items)
            })
            //res.json(items);
        }
    })
})
app.post("/api/cate",function(req,res){
    Category.find(function(err,items){
        if(err){
            req.json({ kq: false, "err":err });
        }
        else{
            res.json(items);
        }
    })
})

//Multer dùng để upload file hình
var multer = require("multer");
var storage = multer.diskStorage({
    destination: function(req,file,cb){ //Đường dẫn tới nơi lưu file
        cb(null,'public/upload') 
    },
    filename: function(req,file,cb){
        cb(null,Date.now()+"-"+file.originalname)
    }
});
var upload = multer({
    storage : storage,
    fileFilter: function(req,file,cb){
        console.log(file);
        if( file.mimetype=="image/bmp"||
            file.mimetype=="image/png"||
            file.mimetype=="image/jpg"||
            file.mimetype=="image/jpeg"||
            file.mimetype=="image/gif"
        ){cb(null,true)}
        else{
            return cb(new Error("Only image are allowed !!"));
        }
    }
}).single("BookImage");  //cái này là name trong thẻ input trong book.ejs

//Login with passport
// app.route("/login")
//get((req,res)=>res.render('login'))
//.post(passport.authenticate('local',{ failureRedirect: '/login',successRedirect:'/cate' }));

app.get('/private',(req,res) => {
    if(req.isAuthenticated()){
        res.send('Welcome to private page')
    }
    else
    {
        res.send('Bạn chưa login')
    }
});
app.get('/dashboard',function(req,res){
    //CheckToken()
    res.render("dashboard")
})

//Cái này là Sử dụng passportFacebook
passport.use(new passportFacebook(
    {
        clientID:"411310039755877",   //Là Id của ứng dụng
        clientSecret:"8dc0dcf8ca5ad4c1a19e7708a3b3795b", //Là khóa bí mật của ứng dụng
        callbackURL:"https://localhost:3000/auth/fb/cb", // Cái này là url cấu hình trong Ứng dụng Facebook : Phần trang web thông tin cơ bản ứng dụng
        profileFields: ['email','gender','locale','displayName'],
        // proxy: true,
        // enableProof: true
    },
    (accessToken, refreshToken, profile, done)=>{
        console.log(profile);
        User.findOne({id: profile._json.id},(err,user)=>{
            if(err){
                return done(err);
            }
            if(user){
                return done(null,user);
            }
            const newUser = new User({
                id:profile._json.id,
                name:profile._json.name,
                email:profile._json.email,
            })
            newUser.save((err)=>{
                return done(null,newUser)
            })
        })
    }
))

passport.serializeUser((user,done)=>{
    done(null,user.id)
})
passport.deserializeUser((id,done)=>{
    User.findOne({id},(err,user)=>{
        done(null,user)
    })
})


// app.get('/cate',(req,res) => res.render("/cate",alert("Bạn đã đăng nhập thành công")));
//Cái này sử dụng passport Local
// passport.use(new LocalStrategy(
//     (username,password,done)=>{
//         fs.readFile('./userDB.json',(err,data)=>{
//             const db = JSON.parse(data)
//             const userRecord = db.find(user => user.name == username)
//             if(userRecord && userRecord.pass == password){
//                 return done(null,userRecord);
//             }
//             else{
//                 return done(null,false);
//             }
//         })
//     }
// ))

// passport.serializeUser((user,done)=>{
//     done(null,user.name)
// })
// passport.deserializeUser((name,done)=>{
//     fs.readFile('./userDB.json',(err,data)=>{
//         const db = JSON.parse(data);
//         const userRecord = db.find(user => user.name == name)
//         if(userRecord){
//             return done(null,userRecord)
//         }
//         else{
//             return done(null,false)
//         }
//     })
// })


app.get("/home",function(req,res){
    res.render("home")
})

app.get("/cate",function(req,res){
    // if(req.isAuthenticated()){
    //     res.render("cate");
    // }
    // else
    // {
    //     res.send('Bạn chưa login')
    // }
    res.render("cate");
})
app.post("/cate",function(req,res){
    // res.send(req.body.txtCate);
    // if(req.isAuthenticated()){
    //     var newCate=new Category({
    //         name:req.body.txtCate,
    //         Books_id:[]
    //     });
    //     newCate.save(function(err){
    //         if(err){
    //             console.log("Save Cate Error: " + err);
    //             res.json({kq:false});
    //         }
    //         else{
    //             console.log("Save Category Successfully");
    //             res.json({kq:true});
    //         }
    //     })
    // }
    // else
    // {
    //     res.send('Bạn chưa login')
    // }
    var newCate=new Category({
        name:req.body.txtCate,
        Books_id:[]
    });
    newCate.save(function(err){
        if(err){
            console.log("Save Cate Error: " + err);
            res.json({kq:false});
        }
        else{
            console.log("Save Category Successfully");
            res.json({kq:true});
        }
    })
   
})
app.get("/book",function(req,res){
    // if(req.isAuthenticated()){
    //     Category.find(function(err,items){
    //         if(err){
    //             res.send("Error");
    //         }
    //         else{
    //             console.log(items);
    //             res.render("book",{Cates:items});
    //         }
    //     })
    // }
    // else{
    //     res.send("Bạn chưa login")
    // }
    Category.find(function(err,items){
        if(err){
            res.send("Error");
        }
        else{
            console.log(items);
            res.render("book",{Cates:items});
        }
    })
})

app.post("/book",function(req,res){
    //Upload image -> save book -> update Book_id(Category)
    //1.Upload
    // if(req.isAuthenticated()){
    //     upload(req, res, function (err) {
    //         if (err instanceof multer.MulterError) {
    //             console.log("A Multer error occurred when uploading."); 
    //             res.json({kq:0,"err":err});
    //         } else if (err) {
    //             console.log("An unknown error occurred when uploading." + err);
    //             res.json({kq:0,"err":err});
    //         }else{
    //             console.log("Upload is okay");
    //             console.log(req.file); // Thông tin file đã upload
    //             //res.send({kq:true,"file":req.file});
    //               //Save
    //             var book = new Book({
    //                 name:req.body.txtName,
    //                 image:req.file.filename,
    //                 file:req.body.txtFile,
    //             })
    //             // res.json(book);
    //             book.save(function(err){
    //                 if(err){
    //                     res.json({
    //                         kq:false,"err":"Error in saving book"
    //                     })
    //                 }
    //                 else{
    //                     //Update Book_id (Category)
    //                     Category.findOneAndUpdate(
    //                         { _id:req.body.cateSelection },
    //                         { $push: { Books_id:book._id } },
    //                         function(err){
    //                             if(err){
    
    //                             }else{
    //                                 res.json({ kq:true });
    //                             }
    //                         }
    //                     )
    //                 }
    //             });
    //         }
    
    //     });
    // }
    // else{
    //     res.send("Bạn chưa login")
    // }
    upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            console.log("A Multer error occurred when uploading."); 
            res.json({kq:0,"err":err});
        } else if (err) {
            console.log("An unknown error occurred when uploading." + err);
            res.json({kq:0,"err":err});
        }else{
            console.log("Upload is okay");
            console.log(req.file); // Thông tin file đã upload
            //res.send({kq:true,"file":req.file});
              //Save
            var book = new Book({
                name:req.body.txtName,
                image:req.file.filename,
                file:req.body.txtFile,
            })
            // res.json(book);
            book.save(function(err){
                if(err){
                    res.json({
                        kq:false,"err":"Error in saving book"
                    })
                }
                else{
                    //Update Book_id (Category)
                    Category.findOneAndUpdate(
                        { _id:req.body.cateSelection },
                        { $push: { Books_id:book._id } },
                        function(err){
                            if(err){

                            }else{
                                res.json({ kq:true });
                            }
                        }
                    )
                }
            });
        }

    });
    //Delete
    //Update
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}) );
app.post("/api/signup",bodyParser.json(),function(req,res){
    bcrypt.hash(req.body.password,saltRounds,function(err,hash){
        console.log(req.body.password)
        var admin = new User({
            id:1,
            name:req.body.name,
            email:req.body.email,
            password: hash,
        });
        admin.save(function(err){
            if(err){
                console.log("Lỗi không thể thêm User")
                res.json({kq:0});
            }
            else{
                console.log(admin)
                //res.json(admin)
                res.render("cate")
            }
        })
    } );
})
app.post("/api/findUser",function(req,res){
    User.find(function(err,items){
        if(err){
            req.json({ kq: false, "err":err });
        }
        else{
            res.json(items);
        }
    })
})
app.get("/user",function(req,res){

    User.find(function(err,items){
        if(err){
            res.send("Error");
        }
        else{
            console.log(items);
            res.render("book",{User:items});
        }
    })
})

///BCRYPT && JWT && SESSION
const bcrypt = require('bcryptjs');
const saltRounds = bcrypt.genSaltSync(10);

var jwt = require('jsonwebtoken')
var secret = "NguyenDuyHung"

// var session = require('express-session');f
app.set('trust proxy',1)
app.use(session({ secret:"Hungreo",cookie:{ maxAge:600000000 }}))


//Add User
app.post("/signup",function(req,res){
     bcrypt.hash(req.body.txtPassword,saltRounds,function(err,hash){
        var admin = new User({
            id:1,
            name:req.body.txtUsername,
            email:req.body.txtEmail,
            password: hash,
        });
        admin.save(function(err){
            if(err){
                console.log("Lỗi không thể thêm User")
                res.json({kq:0});
            }
            else{
                console.log(admin)
                //res.json(admin)
                res.render("cate")
            }
        })
    } );
})

app.post("/login",function(req,res){
    User.findOne({name:req.body.txtUsername} , function(err,item){
        console.log(req.body.txtUsername)
        if(!err && item !=null ){
            console.log(item)
            console.log("Tình trạng đăng nhập: "+req.body.txtUsername+"...."+req.body.txtPassword);
            bcrypt.compare(req.body.txtPassword, item.password, function(err2,res2){
                if(res2==false){
                    res.json({ kq:0 , err:"Mật khẩu sai" + err });
                }
                else{
                    res.json(item);
                }
                // else{
                //     console.log("true")
                //     res.json(item)
                // }
                // else{
                //     jwt.sign(item.toJSON(),secret, { expiresIn: '168h'}, function(err,token){
                //         if(err){
                //             res.json({ kq:0 ,err:"Cấp token sai !" +err });
                //         }
                //         else{
                //             req.session.token = token;
                //             res.render({token: token })
                //         }
                //     })
                // }
            })
        }else{
            res.json({kq:0, err:"Sai tài khoản"});
        }
    })
})
app.get('/',function(req,res){
    //CheckToken()
    res.render("home")
})

// function CheckToken(req,res){
//     if(req.session.token){
//         jwt.verify(req.session.token,secret,function(err,decoded){
//             if(err){
//                 console.log("Hết phiên đăng nhập")
//                 res.render("/login");
//             }
//             else{
//                 console.log("Bạn chưa đăng nhập")
//                 res.render("home")
//             }
//         })
//     }
// }

// =====================================
    // Đăng ký ==============================
    // =====================================
    // hiển thị form đăng ký
    app.get('/signup', function(req, res) {
        res.render('signup.ejs');
    });

    // Xử lý form đăng ký ở đây
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect : '/profile', // Điều hướng tới trang hiển thị profile
        failureRedirect : '/signup', // Trở lại trang đăng ký nếu lỗi
        failureFlash : true 
    }));

    // =====================================
    // Thông tin user đăng ký =====================
    // =====================================
    // app.get('/profile', isLoggedIn, function(req, res) {
    //     res.render('profile.ejs', {
    //         user : req.user // truyền đối tượng user cho profile.ejs để hiển thị lên view
    //     });
    // });

    // =====================================
    // Đăng xuất ==============================
    // =====================================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

