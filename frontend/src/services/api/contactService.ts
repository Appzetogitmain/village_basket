import api from "./config";

export interface IInquiryData {
  name: string;
  email: string;
  message: string;
}

export interface IInquiry extends IInquiryData {
  _id: string;
  status: "Pending" | "Read" | "Resolved";
  createdAt: string;
  updatedAt: string;
}

export const submitInquiry = async (data: IInquiryData) => {
  const response = await api.post("/inquiries", data);
  return response.data;
};

export const getInquiries = async () => {
  const response = await api.get("/inquiries");
  return response.data;
};

export const updateInquiryStatus = async (id: string, status: string) => {
  const response = await api.patch(`/inquiries/${id}`, { status });
  return response.data;
};
