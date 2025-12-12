import { z } from "zod";

export const RequestStatusEnum = z.enum(["Pending", "In-Progress", "Completed", "On-Hold"]);

export const RequestSchema = z.object({
  shop_name: z.string().optional().default(''),
  technician_name: z.string().optional().default(''),
  request_date: z.string().optional().default(''),
  customer_name: z.string().optional().default(''),
  customer_phone: z.string().optional().default(''),
  customer_email: z.string().refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), 'Invalid email').optional().default(''),
  customer_address: z.string().optional().default(''),
  device_model: z.string().optional().default(''),
  device_brand: z.string().optional().default(''),
  serial_number: z.string().optional().default(''),
  operating_system: z.string().optional().default(''),
  accessories_received: z.string().optional().default(''),
  problem_description: z.string().optional().default(''),
  diagnosis_date: z.string().optional().default(''),
  diagnosis_technician: z.string().optional().default(''),
  fault_found: z.string().optional().default(''),
  parts_used: z.string().optional().default(''),
  repair_action: z.string().optional().default(''),
  status: RequestStatusEnum.optional().default('Pending'),
  service_charge: z.coerce.number().nonnegative().optional().default(0),
  parts_cost: z.coerce.number().nonnegative().optional().default(0),
  total_cost: z.coerce.number().nonnegative().optional().default(0),
  deposit_paid: z.coerce.number().nonnegative().optional().default(0),
  balance: z.coerce.number().nonnegative().optional().default(0),
  payment_completed: z.coerce.boolean().optional().default(false),
  user_id: z.string().optional(),
}).passthrough();

export const RequestUpdateSchema = RequestSchema.partial();

export type RequestCreate = z.infer<typeof RequestSchema>;
export type RequestUpdate = z.infer<typeof RequestUpdateSchema>;

export type RequestEntity = RequestCreate & {
  id: string;
  created_at: string;
  updated_at: string;
};

