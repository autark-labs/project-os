import { httpClient } from './httpClient';
import type { ProjectOsJob } from '@/types/jobs';

export const JobsAPIClient = {
  async list() {
    const response = await httpClient.get<ProjectOsJob[]>('/api/jobs');
    return response.data;
  },

  async get(jobId: string) {
    const response = await httpClient.get<ProjectOsJob>(`/api/jobs/${jobId}`);
    return response.data;
  },

  async cancel(jobId: string) {
    const response = await httpClient.post<ProjectOsJob>(`/api/jobs/${jobId}/cancel`);
    return response.data;
  },
};
