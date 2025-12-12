import mongoose, { Schema, model } from "mongoose";
import { encrypt, decrypt } from "../utils/crypto";

const RequestSchema = new Schema(
  {
    shop_name: { type: String, required: true },
    technician_name: { type: String, required: true },
    request_date: { type: String, required: true },
    customer_name: { type: String, required: true, index: true },
    customer_phone: { type: String, required: true, index: true },
    customer_email: { type: String, index: true },
    customer_address: { type: String, required: true },
    device_model: { type: String, required: true },
    device_brand: { type: String, required: true },
    serial_number: { type: String, required: true, index: true },
    operating_system: { type: String, required: true },
    accessories_received: { type: String, required: true },
    problem_description: { type: String, required: true },
    diagnosis_date: { type: String, required: true },
    diagnosis_technician: { type: String, required: true },
    fault_found: { type: String, required: true },
    parts_used: { type: String, required: true },
    repair_action: { type: String, required: true },
    status: { type: String, required: true, index: true },
    service_charge: { type: Number, required: true },
    parts_cost: { type: Number, required: true },
    total_cost: { type: Number, required: true },
    deposit_paid: { type: Number, required: true },
    balance: { type: Number, required: true },
    payment_completed: { type: Boolean, required: true },
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
