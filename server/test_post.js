const http = require('http');

const data = JSON.stringify({
  user_id: "test-user",
  technician_name: "John Doe",
  request_date: "2025-12-12",
  customer_name: "Jane Smith",
  customer_phone: "08012345678",
  customer_email: "",
  customer_address: "123 Main St",
  device_model: "Laptop",
  device_brand: "Dell",
  serial_number: "ABC123",
  operating_system: "Windows 10",
  accessories_received: "Charger",
  problem_description: "Device not turning on",
  status: "Pending",
  service_charge: 0,
  parts_cost: 0,
  total_cost: 0,
  deposit_paid: 0,
  balance: 0,
  payment_completed: false,
});

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/v1/requests',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
  },
};

const req = http.request(options, (res) => {
  console.log('statusCode:', res.statusCode);
  let body = '';
  res.on('data', (chunk) => (body += chunk));
  res.on('end', () => {
    console.log('body:', body);
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error(e);
  process.exit(1);
});

req.write(data);
req.end();
