const mongoose = require('mongoose');
const bcrypt =require('bcrypt');
const jwt=require('jsonwebtoken');
const SALT_I=10;
require('dotenv').config();

const userSchema = mongoose.Schema({
    email: {
        type: String,
        require: true,
        trim: true,
        unique: 1
    },
    password: {
        type: String,
        require: true,
        minlength: 5,

    },
    name: {
        type: String,
        require: true,
        maxlength: 100
    },
    lastname: {
        type: String,
        require: true,
        maxlength: 100
    },
  cart:{
      type:Array,
      default:[]
  },
    history:{
        type:Array,
        default:[]
    },
    role:{
        type:Number,
        default:0
    },
    token:{
        type:String
    }

})

//this run before save and then next run the save function
userSchema.pre('save',function(next){
    var user=this;
 if(user.isModified('password')){
     bcrypt.genSalt(SALT_I,function(err,salt){

        if(err){
            next(err)
        }else{
            bcrypt.hash(user.password,salt,function(err,hash){
                if(err){
                    next(err)
                }else{
                    user.password=hash;
                    next();
                }
            })
        }
    })
 }else{
     next();
 }
    
})


//when login password incrypt
userSchema.methods.comparePassword=function(candidatePassword,cb)//cb for call back
{
    bcrypt.compare(candidatePassword,this.password,function(err,isMatch){
        if(err) return cb(err);
        cb(null,isMatch)
    })
}

//generate token when login
userSchema.methods.generateToken=function(cb){
var user=this;
var token=jwt.sign(user._id.toHexString(),process.env.SECRET);
user.token=token;
user.save(function(err,user){
    if(err) return cb(err);
    cb(null,user)
})
}


//token verifying 
userSchema.statics.findByToken=function(token,cb){
    var user=this;

    jwt.verify(token,process.env.SECRET,function(err,decode){
        user.findOne({"_id":decode,"token":token},function(err,user){
            if(err) return cb(err);
            cb(null,user) 
        })
    })
}

const User = mongoose.model('User', userSchema);

module.exports = { User }