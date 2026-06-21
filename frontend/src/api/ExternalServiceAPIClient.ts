import { httpClient } from './httpClient';
import type { ExternalService, ExternalServiceRequest, HostInventoryActionResult } from '@/types/host';

export const ExternalServiceAPIClient = {
  async list() {
    const response = await httpClient.get<ExternalService[]>('/api/external-services');
    return response.data;
  },

  async add(request: ExternalServiceRequest) {
    const response = await httpClient.post<ExternalService>('/api/external-services', request);
    return response.data;
  },

  async remove(id: string) {
    const response = await httpClient.delete<HostInventoryActionResult>(`/api/external-services/${encodeURIComponent(id)}`);
    return response.data;
  },
};
