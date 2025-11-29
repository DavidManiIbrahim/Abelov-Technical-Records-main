import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  service_requests: defineTable({
    id: v.string(),
    user_id: v.string(),
    shop_name: v.string(),
    technician_name: v.string(),
    request_date: v.string(),
    customer_name: v.string(),
    customer_phone: v.string(),
    customer_email: v.optional(v.string()),
    customer_address: v.string(),
    device_model: v.string(),
    device_brand: v.string(),
    serial_number: v.string(),
    operating_system: v.string(),
    accessories_received: v.string(),
    problem_description: v.string(),
    diagnosis_date: v.string(),
    diagnosis_technician: v.string(),
    fault_found: v.string(),
    parts_used: v.string(),
    repair_action: v.string(),
    status: v.string(),
    service_charge: v.number(),
    parts_cost: v.number(),
    total_cost: v.number(),
    deposit_paid: v.number(),
    balance: v.number(),
    payment_completed: v.boolean(),
    repair_timeline: v.array(v.object({ step: v.string(), date: v.string(), note: v.string(), status: v.string() })),
    customer_confirmation: v.object({ customer_collected: v.boolean(), technician: v.string() }),
    created_at: v.string(),
    updated_at: v.string(),
  }).index('by_user', ['user_id']).index('by_status', ['user_id', 'status']).index('by_created', ['user_id', 'created_at']),

  user_profiles: defineTable({
    id: v.string(),
    email: v.string(),
    full_name: v.optional(v.string()),
    company_name: v.optional(v.string()),
    is_active: v.boolean(),
    created_at: v.string(),
  }).index('by_email', ['email']),

  user_roles: defineTable({
    user_id: v.string(),
    role: v.string(),
    assigned_at: v.string(),
  }).index('by_user', ['user_id']),

  user_activity_logs: defineTable({
    user_id: v.string(),
    action: v.string(),
    metadata: v.optional(v.any()),
    created_at: v.string(),
  }).index('by_user', ['user_id']).index('by_created', ['created_at']),
});
