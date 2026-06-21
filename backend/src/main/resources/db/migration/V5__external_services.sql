create table if not exists external_services (
    id text primary key,
    name text not null,
    url text not null,
    category text not null,
    access_scope text not null,
    health_check_enabled integer not null default 0,
    management_mode text not null default 'linked',
    created_at text not null
);
