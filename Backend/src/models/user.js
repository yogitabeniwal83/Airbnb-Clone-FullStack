const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
  },
  lastName: String,
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true, // We set unique to true to ensure that each email address is unique in the database, preventing duplicate user accounts with the same email.
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
  },
  roles: {
    type: [String],
    enum: ['guest', 'host'],
    default: ['guest'],
  },
  favourites: [{ 
     type: mongoose.Schema.Types.ObjectId,
     ref: 'Home'
  }]
});

// Hydrate legacy records into the new role shape until each account is lazily
// persisted with roles on its next successful login.
userSchema.pre('init', function mapLegacyUserType(user) {
  if (!Array.isArray(user.roles) && ['guest', 'host'].includes(user.userType)) {
    user.roles = user.userType === 'host'
      ? ['guest', 'host']
      : ['guest'];
  }
});



module.exports = mongoose.model("User", userSchema);
