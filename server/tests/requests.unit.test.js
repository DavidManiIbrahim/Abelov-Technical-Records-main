import { describe, it, expect } from "vitest";
import { createRequest, getRequestById, listRequests, updateRequest, deleteRequest } from "../src/services/requests.service";
const sample = {
    shop_name: "Shop",
    technician_name: "Tech",
    request_date: new Date().toISOString(),
    customer_name: "Alice",
    customer_phone: "1234567890",
    customer_email: "alice@example.com",
    customer_address: "123 Street",
    device_model: "Laptop",
    device_brand: "Brand",
    serial_number: "SN123",
    operating_system: "Windows",
    accessories_received: "Charger",
    problem_description: "Does not boot",
    diagnosis_date: new Date().toISOString(),
    diagnosis_technician: "Bob",
    fault_found: "Battery",
    parts_used: "Battery",
    repair_action: "Replace",
    status: "Pending",
    service_charge: 50,
    parts_cost: 100,
    total_cost: 150,
    deposit_paid: 50,
    balance: 100,
    payment_completed: false,
};
describe("Requests service", () => {
    it("creates and lists requests", async () => {
        const created = await createRequest(sample);
        const list = await listRequests();
        expect(list.some((r) => r.id === created.id)).toBe(true);
    });
    it("updates a request", async () => {
        const created = await createRequest(sample);
        const updated = await updateRequest(created.id, { status: "Completed" });
        expect(updated.status).toBe("Completed");
    });
    it("retrieves and deletes a request", async () => {
        const created = await createRequest(sample);
        const fetched = await getRequestById(created.id);
        expect(fetched.id).toBe(created.id);
        const ok = await deleteRequest(created.id);
        expect(ok).toBe(true);
    });
});
