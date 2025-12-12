import { z } from "zod";

export const RequestStatusEnum = z.enum(["Pending", "In-Progress", "Completed", "On-Hold"]);

export const RequestSchema = z.object({
  shop_name: z.string().min(1),
  technician_name: z.string().min(1),
  request_date: z.string().min(1),
  customer_name: z.string().min(1),
  customer_phone: z.string().min(5),
  customer_email: z.string().email().optional(),
  customer_address: z.string().min(1),
  device_model: z.string().min(1),
  device_brand: z.string().min(1),
  serial_number: z.string().min(1),
  operating_system: z.string().min(1),
  accessories_received: z.string().min(1),
  problem_description: z.string().min(1),
  diagnosis_date: z.string().min(1),
  diagnosis_technician: z.string().min(1),
  fault_found: z.string().min(1),
  parts_used: z.string().min(1),
  repair_action: z.string().min(1),
  status: RequestStatusEnum,
  service_charge: z.number().nonnegative(),
  parts_cost: z.number().nonnegative(),
  total_cost: z.number().nonnegative(),
  deposit_paid: z.number().nonnegative(),
  balance: z.number().nonnegative(),
  payment_completed: z.boolean(),
});

export const RequestUpdateSchema = RequestSchema.partial();

export type RequestCreate = z.infer<typeof RequestSchema>;
export type RequestUpdate = z.infer<typeof RequestUpdateSchema>;

export type RequestEntity = RequestCreate & {
  id: string;
  created_at: string;
  updated_at: string;
};

