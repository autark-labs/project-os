import { httpClient } from './httpClient';
import type { ProjectOsJob } from '@/types/jobs';
import type { InstallOptions, InstallPlan } from '@/types/marketplace';

export const MarketplaceInstallClient = {
  async plan(appId: string, options: InstallOptions | Record<string, never> = {}) {
    const response = await httpClient.post<InstallPlan>(`/api/marketplace/apps/${appId}/plan`, options);
    return response.data;
  },

  async install(appId: string, options: InstallOptions | Record<string, never> = {}) {
    const response = await httpClient.post<ProjectOsJob>(`/api/marketplace/apps/${appId}/install`, options);
    return response.data;
  },
};
