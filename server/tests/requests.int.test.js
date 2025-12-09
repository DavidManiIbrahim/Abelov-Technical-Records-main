import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";
const app = createApp();
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
describe("Requests API", () => {
    it("health returns ok", async () => {
        const res = await request(app).get("/health");
        expect(res.status).toBe(200);
        expect(res.body.status).toBe("ok");
    });
    it("CRUD cycle works", async () => {
        const createRes = await request(app).post("/api/v1/requests").send(sample);
        expect(createRes.status).toBe(201);
        const id = createRes.body.data.id;
        const getRes = await request(app).get(`/api/v1/requests/${id}`);
        expect(getRes.status).toBe(200);
        expect(getRes.body.data.customer_name).toBe("Alice");
        const updateRes = await request(app).put(`/api/v1/requests/${id}`).send({ status: "Completed" });
        expect(updateRes.status).toBe(200);
        expect(updateRes.body.data.status).toBe("Completed");
        const listRes = await request(app).get("/api/v1/requests");
        expect(listRes.status).toBe(200);
        expect(Array.isArray(listRes.body.data)).toBe(true);
        const delRes = await request(app).delete(`/api/v1/requests/${id}`);
        expect(delRes.status).toBe(204);
    });
    it("validates payload", async () => {
        const res = await request(app).post("/api/v1/requests").send({});
        expect(res.status).toBe(422);
    });
});
