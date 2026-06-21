import { httpClient } from './httpClient';
import type { ApplicationState } from '@/types/applicationState';

export const ApplicationStateAPIClient = {
  async get(options: { refresh?: boolean } = {}) {
    const response = await httpClient.get<ApplicationState>('/api/application-state', {
      params: options.refresh ? { refresh: true } : undefined,
    });
    return response.data;
  },
};
