const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    name: { type: String, default: '' },
  },
  { timestamps: true },
);

UserSchema.methods.toSafeJSON = function () {
  return {
    id: this._id.toString(),
    email: this.email,
    name: this.name,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', UserSchema);