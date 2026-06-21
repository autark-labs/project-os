import { httpClient } from './httpClient';
import type {
  HostInventoryActionResult,
  HostInventoryResource,
  HostResourceCleanupPlan,
  HostResourceDataDeletionPlan,
  HostResourceRecoveryPlan,
} from '@/types/host';

export const HostInventoryAPIClient = {
  async list(includeIgnored = false) {
    const response = await httpClient.get<HostInventoryResource[]>('/api/host/inventory', { params: { includeIgnored } });
    return response.data;
  },

  async fixture() {
    const response = await httpClient.get<HostInventoryResource[]>('/api/dev/host-inventory-fixture');
    return response.data;
  },

  async ignore(resourceId: string) {
    const response = await httpClient.post<HostInventoryActionResult>(`/api/host/inventory/${encodeURIComponent(resourceId)}/ignore`);
    return response.data;
  },

  async unignore(resourceId: string) {
    const response = await httpClient.delete<HostInventoryActionResult>(`/api/host/inventory/${encodeURIComponent(resourceId)}/ignore`);
    return response.data;
  },

  async cleanupPlan(resourceId: string) {
    const response = await httpClient.post<HostResourceCleanupPlan>(`/api/host/inventory/${encodeURIComponent(resourceId)}/cleanup-plan`);
    return response.data;
  },

  async cleanup(resourceId: string, confirmationText: string) {
    const response = await httpClient.post<HostInventoryActionResult>(`/api/host/inventory/${encodeURIComponent(resourceId)}/cleanup`, { confirmationText });
    return response.data;
  },

  async dataDeletionPlan(resourceId: string) {
    const response = await httpClient.post<HostResourceDataDeletionPlan>(`/api/host/inventory/${encodeURIComponent(resourceId)}/data-deletion-plan`);
    return response.data;
  },

  async deleteData(resourceId: string, confirmationText: string) {
    const response = await httpClient.post<HostInventoryActionResult>(`/api/host/inventory/${encodeURIComponent(resourceId)}/delete-data`, { confirmationText });
    return response.data;
  },

  async recoveryPlan(resourceId: string) {
    const response = await httpClient.post<HostResourceRecoveryPlan>(`/api/host/inventory/${encodeURIComponent(resourceId)}/recovery-plan`);
    return response.data;
  },

  async recover(resourceId: string, confirmationText: string) {
    const response = await httpClient.post<HostInventoryActionResult>(`/api/host/inventory/${encodeURIComponent(resourceId)}/recover`, { confirmationText });
    return response.data;
  },
};
