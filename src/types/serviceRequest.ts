export type DeviceModel = "Laptop" | "Desktop" | "Other";
export type RequestStatus = "Pending" | "Completed" | "Awaiting";

export interface RepairTimelineStep {
  step: string;
  date: string;
  note: string;
  status: string;
}

export interface CustomerConfirmation {
  customer_collected: boolean;
  technician: string;
}

export interface ServiceRequest {
  id: string;
  shop_name: string;
  technician_name: string;
  request_date: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  device_model: DeviceModel;
  device_brand: string;
  serial_number: string;
  operating_system: string;
  accessories_received: string;
  problem_description: string;
  diagnosis_date: string;
  diagnosis_technician: string;
  fault_found: string;
  parts_used: string;
  repair_action: string;
  status: RequestStatus;
  service_charge: number;
  parts_cost: number;
  total_cost: number;
  deposit_paid: number;
  balance: number;
  payment_completed: boolean;
  repair_timeline: RepairTimelineStep[];
  customer_confirmation: CustomerConfirmation;
  created_at: string;
}
