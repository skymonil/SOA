const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const RefreshToken = require('../models/refresh-token'); // ✅ Import the model


const generateTokens = async(user) =>{
    const accessToken = jwt.sign({
        userId:  user._id,
        username: user.username
    }, process.env.JWT_SECRET,{ expiresIn:'60m'})

    const refreshToken = crypto.randomBytes(40).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)
 await RefreshToken.create({ // ✅ Correct model usage
    token: refreshToken,
    user: user._id,
    expiresAt
  });

    return {accessToken,refreshToken}
}


module.exports=generateTokens

