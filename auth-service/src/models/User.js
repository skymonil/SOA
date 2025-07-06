const argon2 = require('argon2'); // Import the Argon2 library
const mongoose = require('mongoose')
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// --- THIS PART IS WHAT YOU'RE ASKING ABOUT ---

// 1. userSchema.pre('save', async function (next) { ... });
//    This is a Mongoose Middleware (also called a "hook" or "pre-hook").
//    It executes a function *before* a document is saved to the database.

userSchema.pre('save', async function (next) {
  // `this` refers to the document being saved (e.g., a new User instance)

  // Check if the 'password' field has been modified or is new.
  // This is important because if you update a user's email,
  // you don't want to re-hash their password if it hasn't changed.
  if (!this.isModified('password')) {
    // If password is not modified, move on to the next middleware or save operation
    return next();
  }

  // If the password *is* modified (or it's a new user):
  try {
    // Hash the plain-text password using Argon2.
    // `this.password` is currently the plain-text password provided by the user.
    // `argon2.hash()` performs the computationally intensive hashing.
    this.password = await argon2.hash(this.password); // Store the hashed password back into `this.password`

    // After hashing successfully, proceed to save the document.
    next();
  } catch (error) {
    // If an error occurs during hashing (e.g., invalid parameters to argon2.hash),
    // pass the error to the next middleware or to Mongoose's error handler,
    // which will typically prevent the save operation from completing.
    next(error);
  }
});

// 2. userSchema.methods.comparePassword = async function (candidatePass) { ... }
//    This adds a custom method to all instances (documents) of the User model.
//    It's used to compare a plain-text password provided by a user during login
//    with the *hashed* password stored in the database.

userSchema.methods.comparePassword = async function (candidatePass) {
  // `this` refers to the specific User document (instance) that this method is called on.
  // `this.password` here will be the HASHED password from the database.
  // `candidatePass` is the plain-text password provided by the user attempting to log in.

  try {
    // `argon2.verify()` compares a plain-text password with a hash.
    // It internally re-hashes the `candidatePass` and compares it to `this.password`.
    // This function handles the salt and Argon2's parameters automatically from the hash itself.
    // It returns `true` if they match, `false` otherwise.
    return await argon2.verify(this.password, candidatePass);
  } catch (error) {
    // If an error occurs during verification (e.g., the stored hash is corrupted),
    // you might log this error. It's generally good practice to return false
    // or re-throw an error indicating a verification problem,
    // rather than letting the application continue as if verification failed.
    // For security, you should generally not distinguish between "user not found"
    // and "incorrect password" to prevent user enumeration attacks.
    console.error("Error during password verification:", error); // Log the error for debugging
    return false; // Safely return false on error
  }
};

userSchema.index({username: "text"})
 const User = mongoose.model('User', userSchema);
//    This line compiles your schema into a Mongoose model.
//    The `User` model is what you'll use to interact with the 'users' collection in MongoDB.
//    (Mongoose pluralizes 'User' to 'users' for the collection name by default).

 module.exports = User;
//    This exports the `User` model so you can `require()` it in other files
//    (e.g., your authentication routes, user management routes) and use it
//    to create, find, update, and delete user documents.