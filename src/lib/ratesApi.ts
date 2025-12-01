import api from "../lib/api";

export interface RateDto {
  clientId: number;
  serviceType: string;
  ratePerKg: number;
  paymentTerms: string;
}

export async function fetchRates(clientId?: number, activeOnly = true) {
  const res = await api.get("/rates", {
    params: { clientId, activeOnly },
  });
  return res.data;
}

export async function upsertRate(dto: RateDto) {
  const res = await api.post("/rates", dto);
  return res.data;
}

export async function deactivateRate(id: number) {
  await api.delete(`/rates/${id}`);
}
