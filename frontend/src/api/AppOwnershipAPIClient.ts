import { httpClient } from './httpClient';
import type { AppOwnershipView } from '@/types/appOwnership';

export const AppOwnershipAPIClient = {
  async list() {
    const response = await httpClient.get<AppOwnershipView[]>('/api/app-ownership');
    return response.data;
  },
};
