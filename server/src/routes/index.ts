import { Router } from "express";
import requests from "./requests.routes";
import admin from "./admin.routes";

const api = Router();

api.use("/requests", requests);
api.use("/admin", admin);

export default api;
