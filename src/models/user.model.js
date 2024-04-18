import mongoose, { Schema } from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
// or
// const { Schema} = mongoose; 

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    fullName: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    avatar: {
        type: String, //Cloudinary Url
        required: true,
    },
    coverImage: {
        type: String, //Cloudinary Url
    },
    watchHistory: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Video'
        }
    ],
    password: {
        type: String,
        required: [true, 'password is required']
    },
    refreshToken: {
        type: String
    }
}, { timestamps: true });


// we are hashing password
userSchema.pre('save', async function (next) {

// only want to hash and update the password when it's either being set for the first time or being modified.
    if (!this.isModified('password')) return next();
    this.password =  await bcrypt.hash(this.password, 10)
    next();

});


// compare password
userSchema.methods.isPasswordCorrect = async function (password) {
  await bcrypt.compare(password , this.password )
}


// generateAccessToken
userSchema.methods.generateAccessToken = function () {
 return  jwt.sign(
        
        {
            id: this._id,
            email: this.email,
            username: this.username,
            fullName:this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env. ACCESS_TOKEN_EXPIRY
        }
        
    )
}

// generateRefreshToken
userSchema.methods.generateRefreshToken = function () {
 return jwt.sign(

        {
            id: this._id
        },
     process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }

    )
}

export const User = mongoose.model('User', userSchema);
