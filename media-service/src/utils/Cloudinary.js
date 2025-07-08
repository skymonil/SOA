const cloudinary = require('cloudinary').v2;
const logger = require('./Logger');

cloudinary.config({
  cloud_name: process.env.cloud_name,
  api_key: process.env.api_key,
  api_secret: process.env.api_secret
});

const uploadToCloudinary = async (file) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: 'auto' },
      (error, result) => {
        if (error) {
          logger.error('Error while uploading to Cloudinary', error);
          return reject(error);
        }
        resolve(result);
      }
    );

    uploadStream.end(file.buffer);
  });
};

module.exports = { uploadToCloudinary };