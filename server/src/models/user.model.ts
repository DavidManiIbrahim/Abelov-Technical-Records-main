import mongoose, { Schema, model } from "mongoose";

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    roles: { type: [String], default: [] },
    is_active: { type: Boolean, default: true },
    password_hash: { type: String },
    password_salt: { type: String },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj._id.toString();
  delete obj._id;
  delete obj.__v;
  delete obj.password_hash;
  delete obj.password_salt;
  return obj;
};

export const UserModel = mongoose.models.users || model("users", UserSchema);
