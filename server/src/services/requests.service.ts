import type { RequestCreate, RequestEntity, RequestUpdate } from "../types/request";
import { RequestModel } from "../models/request.model";

export const listRequests = async (): Promise<RequestEntity[]> => {
  const docs = await RequestModel.find().sort({ created_at: -1 });
  return docs.map((d: any) => d.toJSON());
};

export const getRequestById = async (id: string): Promise<RequestEntity | undefined> => {
  const doc = await RequestModel.findById(id);
  if (!doc) return undefined;
  return doc.toJSON() as any;
};

export const createRequest = async (data: RequestCreate): Promise<RequestEntity> => {
  const doc = await RequestModel.create(data as any);
  return doc.toJSON() as any;
};

export const updateRequest = async (id: string, data: RequestUpdate): Promise<RequestEntity | undefined> => {
  const doc = await RequestModel.findByIdAndUpdate(id, data, { new: true });
  if (!doc) return undefined;
  return doc.toJSON() as any;
};

export const deleteRequest = async (id: string): Promise<boolean> => {
  const res = await RequestModel.findByIdAndDelete(id);
  return !!res;
};

export const recordPayment = async (id: string, amount: number, reference: string): Promise<RequestEntity | undefined> => {
  const request = await RequestModel.findById(id);
  if (!request) return undefined;

  // Calculate new balance
  const currentBalance = request.balance || 0;
  const newBalance = Math.max(0, currentBalance - amount);
  const isCompleted = newBalance <= 0;

  // Update request
  const updatedRequest = await RequestModel.findByIdAndUpdate(
    id,
    {
      balance: newBalance,
      payment_completed: isCompleted,
      // Add transaction record to timeline
      $push: {
        repair_timeline: {
          step: "Payment Received",
          date: new Date().toISOString(),
          note: `Payment of ${amount} received. Ref: ${reference}`,
          status: "Processed"
        }
      }
    },
    { new: true }
  );

  return updatedRequest?.toJSON() as any;
};
