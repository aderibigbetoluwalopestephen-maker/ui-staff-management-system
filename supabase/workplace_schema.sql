-- Staff Data Workplace Hub schema
create extension if not exists pgcrypto;

create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 full_name text, avatar_url text,
 role text not null default 'staff' check (role in ('owner','admin','hr','manager','staff')),
 department text, staff_id uuid, created_at timestamptz not null default now()
);
create table if not exists public.departments (
 id uuid primary key default gen_random_uuid(), name text not null unique, description text,
 created_at timestamptz not null default now()
);
create table if not exists public.teams (
 id uuid primary key default gen_random_uuid(), department_id uuid references public.departments(id) on delete set null,
 name text not null, description text, created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now()
);
create table if not exists public.team_members (
 team_id uuid references public.teams(id) on delete cascade,
 user_id uuid references auth.users(id) on delete cascade, created_at timestamptz not null default now(),
 primary key(team_id,user_id)
);
create table if not exists public.conversations (
 id uuid primary key default gen_random_uuid(),
 type text not null default 'direct' check(type in ('direct','group')),
 name text, created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now()
);
create table if not exists public.conversation_members (
 conversation_id uuid references public.conversations(id) on delete cascade,
 user_id uuid references auth.users(id) on delete cascade, last_read_at timestamptz,
 created_at timestamptz not null default now(), primary key(conversation_id,user_id)
);
create table if not exists public.messages (
 id uuid primary key default gen_random_uuid(),
 conversation_id uuid not null references public.conversations(id) on delete cascade,
 sender_id uuid not null references auth.users(id) on delete cascade,
 content text not null, attachment_url text, created_at timestamptz not null default now(), edited_at timestamptz
);
create table if not exists public.notifications (
 id uuid primary key default gen_random_uuid(),
 recipient_id uuid not null references auth.users(id) on delete cascade,
 type text not null default 'system', title text not null, message text, reference_id uuid,
 is_read boolean not null default false, created_at timestamptz not null default now()
);
create table if not exists public.announcements (
 id uuid primary key default gen_random_uuid(), title text not null, content text not null,
 author_id uuid references auth.users(id) on delete set null, target_department text,
 priority text not null default 'normal' check(priority in ('low','normal','high','urgent')),
 published_at timestamptz not null default now(), expires_at timestamptz
);
create table if not exists public.tasks (
 id uuid primary key default gen_random_uuid(), title text not null, description text,
 assigned_to uuid references auth.users(id) on delete set null, assigned_by uuid references auth.users(id) on delete set null,
 department text, priority text not null default 'normal' check(priority in ('low','normal','high','urgent')),
 status text not null default 'todo' check(status in ('todo','in_progress','done')),
 due_date date, created_at timestamptz not null default now(), completed_at timestamptz
);
create table if not exists public.events (
 id uuid primary key default gen_random_uuid(), title text not null, description text,
 organizer_id uuid references auth.users(id) on delete set null, start_time timestamptz not null,
 end_time timestamptz, location text, meeting_url text, created_at timestamptz not null default now()
);
create table if not exists public.event_attendees (
 event_id uuid references public.events(id) on delete cascade, user_id uuid references auth.users(id) on delete cascade,
 status text not null default 'invited', primary key(event_id,user_id)
);
create table if not exists public.attendance (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 work_date date not null default current_date, check_in timestamptz, check_out timestamptz,
 status text not null default 'present', location text, unique(user_id,work_date)
);
create table if not exists public.approval_requests (
 id uuid primary key default gen_random_uuid(), type text not null,
 requester_id uuid references auth.users(id) on delete set null, approver_id uuid references auth.users(id) on delete set null,
 status text not null default 'pending' check(status in ('pending','approved','rejected')),
 payload jsonb not null default '{}'::jsonb, comment text, created_at timestamptz not null default now(), decided_at timestamptz
);
create table if not exists public.documents (
 id uuid primary key default gen_random_uuid(), name text not null, storage_path text not null,
 uploaded_by uuid references auth.users(id) on delete set null, department text, folder text default 'General',
 size_bytes bigint, mime_type text, created_at timestamptz not null default now()
);

alter table public.staff add column if not exists user_id uuid;
create index if not exists idx_staff_user_id on public.staff(user_id);
create index if not exists idx_messages_conversation on public.messages(conversation_id,created_at);
create index if not exists idx_notifications_recipient on public.notifications(recipient_id,is_read,created_at);
create index if not exists idx_tasks_assigned on public.tasks(assigned_to,status);
create index if not exists idx_events_start on public.events(start_time);
create index if not exists idx_attendance_user_date on public.attendance(user_id,work_date);

insert into public.departments(name) values
('Administration'),('Human Resources'),('Finance'),('ICT'),('Academic'),('Operations')
on conflict(name) do nothing;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path=public as $$
begin
 insert into public.profiles(id,full_name)
 values(new.id,coalesce(new.raw_user_meta_data->>'full_name',split_part(new.email,'@',1)))
 on conflict(id) do nothing;
 return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.is_manager() returns boolean
language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.profiles where id=auth.uid() and role in ('owner','admin','hr','manager'));
$$;

alter table public.profiles enable row level security;
alter table public.departments enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.announcements enable row level security;
alter table public.tasks enable row level security;
alter table public.events enable row level security;
alter table public.event_attendees enable row level security;
alter table public.attendance enable row level security;
alter table public.approval_requests enable row level security;
alter table public.documents enable row level security;

drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated using(true);
drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());

drop policy if exists departments_read on public.departments;
create policy departments_read on public.departments for select to authenticated using(true);
drop policy if exists departments_manage on public.departments;
create policy departments_manage on public.departments for all to authenticated using(public.is_manager()) with check(public.is_manager());

drop policy if exists teams_read on public.teams;
create policy teams_read on public.teams for select to authenticated using(true);
drop policy if exists teams_manage on public.teams;
create policy teams_manage on public.teams for all to authenticated using(public.is_manager()) with check(public.is_manager());

drop policy if exists team_members_read on public.team_members;
create policy team_members_read on public.team_members for select to authenticated using(true);
drop policy if exists team_members_manage on public.team_members;
create policy team_members_manage on public.team_members for all to authenticated using(public.is_manager()) with check(public.is_manager());

drop policy if exists conversations_member_read on public.conversations;
create policy conversations_member_read on public.conversations for select to authenticated
using(exists(select 1 from public.conversation_members cm where cm.conversation_id=id and cm.user_id=auth.uid()));
drop policy if exists conversations_create on public.conversations;
create policy conversations_create on public.conversations for insert to authenticated with check(created_by=auth.uid());

drop policy if exists conv_members_read on public.conversation_members;
create policy conv_members_read on public.conversation_members for select to authenticated using(user_id=auth.uid());
drop policy if exists conv_members_insert on public.conversation_members;
create policy conv_members_insert on public.conversation_members for insert to authenticated with check(user_id=auth.uid() or public.is_manager());

drop policy if exists messages_member_read on public.messages;
create policy messages_member_read on public.messages for select to authenticated
using(exists(select 1 from public.conversation_members cm where cm.conversation_id=conversation_id and cm.user_id=auth.uid()));
drop policy if exists messages_send on public.messages;
create policy messages_send on public.messages for insert to authenticated
with check(sender_id=auth.uid() and exists(select 1 from public.conversation_members cm where cm.conversation_id=conversation_id and cm.user_id=auth.uid()));

drop policy if exists notifications_own on public.notifications;
create policy notifications_own on public.notifications for all to authenticated using(recipient_id=auth.uid()) with check(recipient_id=auth.uid());

drop policy if exists announcements_read on public.announcements;
create policy announcements_read on public.announcements for select to authenticated using(expires_at is null or expires_at>now());
drop policy if exists announcements_manage on public.announcements;
create policy announcements_manage on public.announcements for all to authenticated using(public.is_manager()) with check(public.is_manager());

drop policy if exists tasks_read on public.tasks;
create policy tasks_read on public.tasks for select to authenticated using(assigned_to=auth.uid() or assigned_by=auth.uid() or public.is_manager());
drop policy if exists tasks_manage on public.tasks;
create policy tasks_manage on public.tasks for all to authenticated using(assigned_to=auth.uid() or assigned_by=auth.uid() or public.is_manager())
with check(assigned_by=auth.uid() or public.is_manager());

drop policy if exists events_read on public.events;
create policy events_read on public.events for select to authenticated using(true);
drop policy if exists events_manage on public.events;
create policy events_manage on public.events for all to authenticated using(organizer_id=auth.uid() or public.is_manager())
with check(organizer_id=auth.uid() or public.is_manager());

drop policy if exists event_attendees_read on public.event_attendees;
create policy event_attendees_read on public.event_attendees for select to authenticated using(user_id=auth.uid() or public.is_manager());

drop policy if exists attendance_own on public.attendance;
create policy attendance_own on public.attendance for select to authenticated using(user_id=auth.uid() or public.is_manager());
drop policy if exists attendance_write on public.attendance;
create policy attendance_write on public.attendance for insert to authenticated with check(user_id=auth.uid());
drop policy if exists attendance_update on public.attendance;
create policy attendance_update on public.attendance for update to authenticated using(user_id=auth.uid() or public.is_manager()) with check(user_id=auth.uid() or public.is_manager());

drop policy if exists approvals_read on public.approval_requests;
create policy approvals_read on public.approval_requests for select to authenticated using(requester_id=auth.uid() or approver_id=auth.uid() or public.is_manager());
drop policy if exists approvals_insert on public.approval_requests;
create policy approvals_insert on public.approval_requests for insert to authenticated with check(requester_id=auth.uid());
drop policy if exists approvals_decide on public.approval_requests;
create policy approvals_decide on public.approval_requests for update to authenticated using(approver_id=auth.uid() or public.is_manager()) with check(approver_id=auth.uid() or public.is_manager());

drop policy if exists documents_read on public.documents;
create policy documents_read on public.documents for select to authenticated using(true);
drop policy if exists documents_manage on public.documents;
create policy documents_manage on public.documents for all to authenticated using(uploaded_by=auth.uid() or public.is_manager()) with check(uploaded_by=auth.uid() or public.is_manager());

insert into storage.buckets(id,name,public) values('workplace-documents','workplace-documents',false)
on conflict(id) do nothing;

drop policy if exists workplace_storage_read on storage.objects;
create policy workplace_storage_read on storage.objects for select to authenticated using(bucket_id='workplace-documents');
drop policy if exists workplace_storage_insert on storage.objects;
create policy workplace_storage_insert on storage.objects for insert to authenticated with check(bucket_id='workplace-documents');
drop policy if exists workplace_storage_delete on storage.objects;
create policy workplace_storage_delete on storage.objects for delete to authenticated using(bucket_id='workplace-documents' and (owner=auth.uid() or public.is_manager()));

do $$ begin alter publication supabase_realtime add table public.messages; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.notifications; exception when duplicate_object then null; end $$;

-- Create the first user in Supabase Auth, then run:
-- update public.profiles set role='owner' where id='YOUR_AUTH_USER_UUID';
