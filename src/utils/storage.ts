import { ServiceRequest } from "@/types/serviceRequest";

const STORAGE_KEY = "service_requests";

export const saveServiceRequest = (request: ServiceRequest): void => {
  const requests = getServiceRequests();
  requests.push(request);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
};

export const getServiceRequests = (): ServiceRequest[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const getServiceRequestById = (id: string): ServiceRequest | undefined => {
  const requests = getServiceRequests();
  return requests.find(r => r.id === id);
};

export const updateServiceRequest = (updatedRequest: ServiceRequest): void => {
  const requests = getServiceRequests();
  const index = requests.findIndex(r => r.id === updatedRequest.id);
  if (index !== -1) {
    requests[index] = updatedRequest;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
  }
};

export const generateRequestId = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `SR-${timestamp}-${random}`.toUpperCase();
};
