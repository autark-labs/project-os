import { httpClient } from './httpClient';
import type { ObservedServiceActionResult, ObservedServiceAdoptionPlan, ObservedServiceView } from '@/types/observedService';

export const ObservedServicesAPIClient = {
  async list() {
    const response = await httpClient.get<ObservedServiceView[]>('/api/observed-services');
    return response.data;
  },

  async refresh() {
    const response = await httpClient.post<ObservedServiceView[]>('/api/observed-services/refresh');
    return response.data;
  },

  async get(id: string) {
    const response = await httpClient.get<ObservedServiceView>(`/api/observed-services/${encodeURIComponent(id)}`);
    return response.data;
  },

  async pin(id: string) {
    const response = await httpClient.post<ObservedServiceActionResult>(`/api/observed-services/${encodeURIComponent(id)}/pin`);
    return response.data;
  },

  async unpin(id: string) {
    const response = await httpClient.post<ObservedServiceActionResult>(`/api/observed-services/${encodeURIComponent(id)}/unpin`);
    return response.data;
  },

  async match(id: string, catalogAppId: string | null) {
    const response = await httpClient.post<ObservedServiceActionResult>(`/api/observed-services/${encodeURIComponent(id)}/match`, { catalogAppId });
    return response.data;
  },

  async adoptionPlan(id: string) {
    const response = await httpClient.post<ObservedServiceAdoptionPlan>(`/api/observed-services/${encodeURIComponent(id)}/adoption-plan`);
    return response.data;
  },

  async adopt(id: string, confirmation: string) {
    const response = await httpClient.post<ObservedServiceActionResult>(`/api/observed-services/${encodeURIComponent(id)}/adopt`, {
      confirmed: true,
      takeControlConfirmed: true,
      confirmation,
    });
    return response.data;
  },
};
