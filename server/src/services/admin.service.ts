import { env } from "../config/env";
import { UserModel } from "../models/user.model";
import { RequestModel } from "../models/request.model";

export const ensureAdminWithSampleRequest = async () => {
  const adminEmail = env.ADMIN_EMAIL || "admin@abelov.ng";

  let adminDoc = await UserModel.findOne({ email: adminEmail });
  let adminCreated = false;
  if (!adminDoc) {
    adminDoc = await UserModel.create({ email: adminEmail, roles: ["admin"], is_active: true } as any);
    adminCreated = true;
  }

  const admin = adminDoc.toJSON() as any;

  let existing = await RequestModel.findOne({ user_id: admin.id });
  let requestCreated = false;
  if (!existing) {
    const sample = {
      shop_name: "Abelov Technical Records",
      technician_name: "Admin Technician",
      request_date: new Date().toISOString().slice(0, 10),
      customer_name: "John Doe",
      customer_phone: "+234-000-0000",
      customer_email: "john.doe@example.com",
      customer_address: "123 Main Street, Lagos",
      device_model: "Galaxy S21",
      device_brand: "Samsung",
      serial_number: "SN-TEST-0001",
      operating_system: "Android 13",
      accessories_received: "Charger, Case",
      problem_description: "Screen cracked and battery drains fast",
      diagnosis_date: new Date().toISOString().slice(0, 10),
      diagnosis_technician: "Admin Technician",
      fault_found: "Damaged display and degraded battery",
      parts_used: "Display panel, Battery",
      repair_action: "Replaced display and battery",
      status: "Pending",
      service_charge: 15000,
      parts_cost: 45000,
      total_cost: 60000,
      deposit_paid: 10000,
      balance: 50000,
      payment_completed: false,
      user_id: admin.id,
    };
    existing = await RequestModel.create(sample as any);
    requestCreated = true;
  }

  const request = existing ? (existing.toJSON() as any) : undefined;

  return { admin, request, adminCreated, requestCreated };
};

