create table if not exists project_os_jobs(
    job_id text primary key,
    job_type text not null,
    subject_id text,
    status text not null,
    current_step text,
    steps_json text not null,
    error_code text,
    error_message text,
    error_details_json text not null default '{}',
    created_at text not null,
    updated_at text not null
);

create index if not exists idx_project_os_jobs_status on project_os_jobs(status);
create index if not exists idx_project_os_jobs_type_subject on project_os_jobs(job_type, subject_id);
create index if not exists idx_project_os_jobs_updated_at on project_os_jobs(updated_at desc);
