import mongoose, {Schema} from "mongoose";
import  jwt  from "jsonwebtoken";
import bcrypt from "bcrypt"

const userSchema = new Schema(
    {
         fullName: {
            type: String,
            required: true,
            trim: true,
            index: true
         },

         userName: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true            
         },

         password: { 
            type: String,
            required: [true , "password is required"],
            minlength: [6, "Password must be at least 6 characters long"],
         },

         role: {
            type: String,
            enum: ["Student" , "faculty"],
            require: [true , "please select role"]
         },

         semester: {
            type: Number,
            
            validate: {
                validator: function (value) {
                    if(this.role === "Student"){
                        return value !== undefined && value >=1 && value <= 8;
                    }
                    return true;
                },
                message: "Semester must be between 1 and 8 for students"
            },
         },

         department: {
            type: String,
            enum: ["CSE" , "IT" , "MECH" , "CIVIL" , "ELECTRONICS" , "ELECTRICAL"],
            require: [true , "please select department"]
         }
    },
    {
        timestamps: true
    }
)

// safe the password , if new password hash the password
userSchema.pre("save" , async function (next) {

    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password , 10)
    next()
    
})

// compare the password
userSchema.methods.isPasswordCorrect = async function (password) {
     return await bcrypt.compare(password , this.password)
}

// generate access token 
userSchema.methods.generateAccessToken = function (){
    return jwt.sign(
        {
             _id: this._id,
             userName: this.userName,
             fullName: this.fullName,
             role: this.role
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}


// generate refresh token 
userSchema.methods.generateRefreshToken = function (){
    return jwt.sign(
        {
             _id: this._id,
             userName: this.userName,
             fullName: this.fullName,
             role: this.role
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User" , userSchema);

