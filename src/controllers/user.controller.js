import { asyncHandler } from "../utils/asyncHandler.js";
import {User} from '../models/user.model.js'
import { uploadOnCloudinary } from "../utils/cloudinary.js"; 
import { ApiError } from "../utils/ApiError.js";
import {ApiResponse} from '../utils/ApiResponse.js'

const registerUser = asyncHandler( async(req, res) => {
    
    /* STEPS :- 
    get user details from frontend
    validation - not empty
    check if user already exists: username, email
    check for images, check for avatar
    upload them to cloudinary, avatar
    create user object - create entry in db
    remove password and refresh token field from response
    check for user creation
    return res */

    // get user details from frontend
    const {fullName, email, username, password} = req.body;
    // console.log("Email :", email)

    // validation - not empty
    if (!fullName || fullName.trim() === "") {
    throw new ApiError(400, "Full name is required");
    } 
    else if (!email || email.trim() === "") {
        throw new ApiError(400, "Email is required");
    }
    else if (!username || username.trim() === "") {
        throw new ApiError(400, "Username is required");
    }
    else if (!password || password.trim() === "") {
        throw new ApiError(400, "Password is required");
    }

    // check if user already exists: username, email
    const existedUser = await User.findOne({
        $or : [{username}, {email}]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    // check for images, check for avatar
    //avatar - check
    const avatarLocalPath = req.files?.avatar[0]?.path
    //cover image
    // const coverImageLocalPath = req.files?.coverImage[0]?.path
    
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }

    // 5. Upload images to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = coverImageLocalPath
        ? await uploadOnCloudinary(coverImageLocalPath)
        : null;

    if (!avatar) {
        throw new ApiError(400, "Failed to upload avatar to Cloudinary");
    }

    // 6. Create user
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),
    });

    
    // remove password and refresh token field from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    
    // check for user creation
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }
    
    // return res 
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

})

const generateAccessAndRefereshTokens = async (userId) => {

    try {
        const user = await User.findById(userId)
        const accessToken = await User.generateAcessToken()
        const refreshToken = await generateRefreshToken()
    
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})
    
        return {accessToken, refreshToken};
    } catch (error) {
        throw new ApiError(500, "Somthing went wrong while generatin Tokens")
    }
}

const loginUser = asyncHandler ( async (req, res) => {

    const {username, email, password} = req.body

    if(!username && !email){
        throw new ApiError(400, "Username or Email aya hi nhi req.body se")
    }

    const user = await User.findOne( {
        $or : [{username}, {email}]
    } )

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select( " -password -refreshToken " )

    const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: useloggedInUser, accessToken, refreshToken
            },
            "User Logged In Successfully !!"
        )
    )

} )

const logoutUser = asyncHandler ( async ( req, res ) => {

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset : {
                refreshToken : 1
            }
        },
        {
            new : true
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
} )



export {
    registerUser,
    loginUser,
    logoutUser
}