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
    this.set("customer_email", encrypt(v));
  }
  if (this.isModified("customer_phone") && this.get("customer_phone")) {
    const v = this.get("customer_phone") as string;
    this.set("customer_phone", encrypt(v));
  }
  next();
});

RequestSchema.methods.toJSON = function () {
  const obj = this.toObject();
  if (obj.customer_email) obj.customer_email = decrypt(obj.customer_email);
  if (obj.customer_phone) obj.customer_phone = decrypt(obj.customer_phone);
  obj.id = obj._id.toString();
  delete obj._id;
  delete obj.__v;
  return obj;
};

export type RequestDoc = mongoose.Document & {
  shop_name: string;
};

export const RequestModel = mongoose.models.requests || model("requests", RequestSchema);
