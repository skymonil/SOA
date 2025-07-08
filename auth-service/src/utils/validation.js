const joi = require('joi')


const validateCreatePost = (data)=>{
  const schema = joi.object({
    content: joi.string().min(3).max(50).required(),
    mediaIds: joi.array()
  })

  return schema.validate(data)
}
const validateRegistration = (data) =>{
    const schema = joi.object({
        username: joi.string().min(3).max(50).required(),
        email: joi.string().email().required(),
        password: joi.string().min(6).required(),

    })
    return schema.validate(data)
}
const validatelogin = (data) => {
  const schema = joi.object({
    email: joi.string().email().required(),
    password: joi.string().min(6).required(),
  });

  return schema.validate(data);
};
module.exports = { validateRegistration, validatelogin,validateCreatePost };