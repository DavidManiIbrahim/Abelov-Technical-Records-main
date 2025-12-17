import swaggerJSDoc from "swagger-jsdoc";

export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Technical Records API",
      version: "1.0.0",
      description: "REST API for technical service requests",
    },
    servers: [{ url: "https://abelov-technical-records-backend.onrender.com" }, { url: "http://localhost:8080" }],
    components: {
      schemas: {
        Request: {
          type: "object",
          properties: {
            id: { type: "string" },
            shop_name: { type: "string" },
            technician_name: { type: "string" },
            request_date: { type: "string" },
            customer_name: { type: "string" },
            customer_phone: { type: "string" },
            customer_email: { type: "string" },
            customer_address: { type: "string" },
            device_model: { type: "string" },
            device_brand: { type: "string" },
            serial_number: { type: "string" },
            operating_system: { type: "string" },
            accessories_received: { type: "string" },
            problem_description: { type: "string" },
            diagnosis_date: { type: "string" },
            diagnosis_technician: { type: "string" },
            fault_found: { type: "string" },
            parts_used: { type: "string" },
            repair_action: { type: "string" },
            status: { type: "string" },
            service_charge: { type: "number" },
            parts_cost: { type: "number" },
            total_cost: { type: "number" },
            deposit_paid: { type: "number" },
            balance: { type: "number" },
            payment_completed: { type: "boolean" },
            created_at: { type: "string" },
            updated_at: { type: "string" },
          },
        },
      },
    },
    tags: [{ name: "Requests" }],
    paths: {
      "/api/v1/requests": {
        get: {
          tags: ["Requests"],
          summary: "List all requests",
          responses: { 200: { description: "OK" } },
        },
        post: {
          tags: ["Requests"],
          summary: "Create a request",
          responses: { 201: { description: "Created" }, 422: { description: "Validation error" } },
        },
      },
      "/api/v1/requests/{id}": {
        get: { tags: ["Requests"], summary: "Get by id", responses: { 200: { description: "OK" }, 404: { description: "Not Found" } } },
        put: { tags: ["Requests"], summary: "Update by id", responses: { 200: { description: "OK" }, 422: { description: "Validation error" } } },
        delete: { tags: ["Requests"], summary: "Delete by id", responses: { 204: { description: "No Content" }, 404: { description: "Not Found" } } },
      },
    },
  },
  apis: [],
});

