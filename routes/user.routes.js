import { Router } from "express";
import {
    registerUser,
    loginUser,
    logOutUser,
    changeCurrentPassword,
    updateAccountDetails,
    refreshAccessToken


} from "../controllers/user.controller.js"
import { verifyJWT } from "../middleware/auth.middleware.js";

const router  = Router()

router.route("/register").post(registerUser) 

router.route("/login").post(loginUser)

router.route("/logOut").post(verifyJWT , logOutUser)

router.route("/refresh-token").post(refreshAccessToken)

router.route("/change-password").post(verifyJWT , changeCurrentPassword)

router.route("/update-account").patch(verifyJWT , updateAccountDetails)



export default router