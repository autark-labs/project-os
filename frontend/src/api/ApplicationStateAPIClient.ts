import { httpClient } from './httpClient';
import type { ApplicationState } from '@/types/applicationState';

export const ApplicationStateAPIClient = {
  async get(options: { refresh?: boolean } = {}) {
    const response = await httpClient.get<ApplicationState>('/api/application-state', {
      params: options.refresh ? { refresh: true } : undefined,
    });
    return response.data;
  },

  async refresh() {
    const response = await httpClient.post<ApplicationState>('/api/application-state/refresh');
    return response.data;
  },
};
