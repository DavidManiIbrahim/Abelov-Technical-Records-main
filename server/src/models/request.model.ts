import mongoose, { Schema, model } from "mongoose";
import { encrypt, decrypt } from "../utils/crypto";

const RequestSchema = new Schema(
  {
    shop_name: { type: String },
    technician_name: { type: String },
    request_date: { type: String },
    customer_name: { type: String, index: true },
    customer_phone: { type: String, index: true },
    customer_email: { type: String, index: true },
    customer_address: { type: String },
    device_model: { type: String },
    device_brand: { type: String },
    serial_number: { type: String, index: true },
    operating_system: { type: String },
    accessories_received: { type: String },
    problem_description: { type: String },
    diagnosis_date: { type: String },
    diagnosis_technician: { type: String },
    fault_found: { type: String },
    parts_used: { type: String },
    repair_action: { type: String },
    status: { type: String, index: true },
    service_charge: { type: Number },
    parts_cost: { type: Number },
    total_cost: { type: Number },
    deposit_paid: { type: Number },
    balance: { type: Number },
    payment_completed: { type: Boolean },
    user_id: { type: String, index: true },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

RequestSchema.index({ status: 1, created_at: -1 });

RequestSchema.pre("save", function (next) {
  if (this.isModified("customer_email") && this.get("customer_email")) {
    const v = this.get("customer_email") as string;
    // Only encrypt if value is not empty
    if (v.trim()) {
      this.set("customer_email", encrypt(v));
    }
  }
  if (this.isModified("customer_phone") && this.get("customer_phone")) {
    const v = this.get("customer_phone") as string;
    // Only encrypt if value is not empty
    if (v.trim()) {
      this.set("customer_phone", encrypt(v));
    }
  }
  next();
});

RequestSchema.methods.toJSON = function () {
  const obj = this.toObject();
  try {
    // Safely decrypt - only if value exists and looks encrypted
    if (obj.customer_email && typeof obj.customer_email === 'string') {
      // Check if it looks like encrypted data (base64 format)
      if (obj.customer_email.includes('+') || obj.customer_email.includes('/') || obj.customer_email.length > 100) {
        obj.customer_email = decrypt(obj.customer_email);
      }
    }
    if (obj.customer_phone && typeof obj.customer_phone === 'string') {
      // Check if it looks like encrypted data (base64 format)
      if (obj.customer_phone.includes('+') || obj.customer_phone.includes('/') || obj.customer_phone.length > 100) {
        obj.customer_phone = decrypt(obj.customer_phone);
      }
    }
  } catch (e) {
    // If decryption fails, leave the value as-is
    console.warn('Decryption failed:', e);
  }
  obj.id = obj._id.toString();
  delete obj._id;
  delete obj.__v;
  return obj;
};

export type RequestDoc = mongoose.Document & {
  shop_name: string;
};

export const RequestModel = mongoose.models.requests || model("requests", RequestSchema);
