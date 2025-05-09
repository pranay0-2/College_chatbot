import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { User } from "../models/user.model.js"
import mongoose from "mongoose"
import jwt from "jsonwebtoken"

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })

    return { accessToken, refreshToken }

  } catch (err) {
    throw new ApiError(500, "Error while generating access and refresh token")
  }
}

const registerUser = asyncHandler(async (req, res) => {

  // get user detail from frontend
  // validations : not empty 
  // check if user already exists
  // create user object  - create entry in db
  // remove password and refresh token field from response
  // check for user creation 
  // return res

  //1
  const { fullName, userName, password, semester, department, role} = req.body;

  //2
  if ([fullName, userName, password, role].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  if(role === "Student" && (semester === undefined || semester === "") ){
    throw new ApiError(400, "Semester is required for students");
  }

  if(role === "Student" && (department === undefined || department === "")){
    throw new ApiError(400 , "Department is required for students")
  }

  //3
  const existedUser = await User.findOne({
    $or: [
      { fullName: new RegExp(`^${fullName}$`, 'i') },
      { userName: new RegExp(`^${userName}$`, 'i') }
    ]
  });

  if (existedUser) {
    throw new ApiError(409, "User with same name and userName already exists")
  }

  //4
  const user = await User.create({
    fullName,
    userName: userName.toLowerCase(),
    password,
    role
  })

  if(role === "Student"){
    user.semester = semester;
    user.department = department;
  }
  // save the user to the database
  await user.save({ validateBeforeSave: false})

  //5 
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering user")
  }

  //6
  return res.status(201).json(
    new ApiResponse(200, createdUser, "User registered successfully")
  )

})

const loginUser = asyncHandler(async (req, res) => {

  // req.body -> data
  // give me the user with this userName  and  find user 
  // password check
  // access and refresh token
  // send cookie

  //1
  const { userName, fullName, password } = req.body

  if (!userName && !fullName) {
    throw new ApiError(400, "userName or fullName is required")
  }

  //2
  //  const user = await User.findOne({ userName })
  const user = await User.findOne({ userName }).select("+password")


  if (!user) {
    throw new ApiError(404, "User does not exist")
  }

  //3
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user Credentials")
  }

  //4
  const { refreshToken, accessToken } = await generateAccessAndRefreshToken(user._id)

  const loggedInuser = await User.findById(user._id).select("-password -refreshToken")

  const options = {
    httpOnly: true, // prevent the javaScript from accessing the cookie
    secure: true   // sends cookies over by HTTPS 
  }

  //5
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        "User loggedIn successfully"
      )
    )
})

const logOutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1 // this removes the field from document
      }
    },
    {
      new: true
    }
  )

  const options = {
    httpOnly: true,
    secure: true
  }

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {

  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request")
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    )

    const user = await User.findById(decodedToken?._id)

    if (!user) {
      throw new ApiError(401, "Invalid refresh token")
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used")

    }

    const options = {
      httpOnly: true,
      secure: true
    }

    const { accessToken, newRefreshToken } = await generateAccessAndRefereshTokens(user._id)

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      )
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token")
  }

})

const changeCurrentPassword = asyncHandler(async (req, res) => {

  const { oldPassword, newPassword } = req.body



  const user = await User.findById(req.user?._id)
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password")
  }

  user.password = newPassword
  await user.save({ validateBeforeSave: false })

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, userName } = req.body

  if (!fullName || !userName) {
    throw new ApiError(400, "All fields are required")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        userName
      }
    },
    {
      new: true
    }
  ).select("-password")

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Account Details updated Successfully"))

})

export {
  registerUser,
  loginUser,
  logOutUser,
  changeCurrentPassword,
  updateAccountDetails,
  refreshAccessToken
}
