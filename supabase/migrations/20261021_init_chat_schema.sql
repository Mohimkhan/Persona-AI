-- 1. Create public.users table (mirrored from auth.users)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  fullname text,
  image_url text,
  raw_user_meta_data jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Trigger function to synchronize auth.users -> public.users
create or replace function public.handle_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_fullname text;
  v_image_url text;
begin
  if tg_op = 'INSERT' then
    v_fullname := coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'user_name',
      split_part(coalesce(new.email, 'User'), '@', 1)
    );
    v_image_url := coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture',
      new.raw_user_meta_data->>'image_url',
      null
    );

    insert into public.users as u (id, email, fullname, image_url, raw_user_meta_data, created_at, updated_at)
    values (
      new.id,
      new.email,
      v_fullname,
      v_image_url,
      coalesce(new.raw_user_meta_data, '{}'::jsonb),
      now(),
      now()
    )
    on conflict (id) do update set
      email = excluded.email,
      fullname = coalesce(excluded.fullname, u.fullname),
      image_url = coalesce(excluded.image_url, u.image_url),
      raw_user_meta_data = excluded.raw_user_meta_data,
      updated_at = now();

    return new;

  elsif tg_op = 'UPDATE' then
    v_fullname := coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'user_name',
      (select u.fullname from public.users u where u.id = new.id)
    );
    v_image_url := coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture',
      new.raw_user_meta_data->>'image_url',
      (select u.image_url from public.users u where u.id = new.id)
    );

    update public.users
    set
      email = new.email,
      fullname = v_fullname,
      image_url = v_image_url,
      raw_user_meta_data = coalesce(new.raw_user_meta_data, '{}'::jsonb),
      updated_at = now()
    where id = new.id;

    return new;

  elsif tg_op = 'DELETE' then
    delete from public.users where id = old.id;
    return old;
  end if;

  return null;
end;
$$;

-- Create auth triggers
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'on_auth_user_created') then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute function public.handle_auth_user();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'on_auth_user_updated') then
    create trigger on_auth_user_updated
      after update on auth.users
      for each row execute function public.handle_auth_user();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'on_auth_user_deleted') then
    create trigger on_auth_user_deleted
      after delete on auth.users
      for each row execute function public.handle_auth_user();
  end if;
end $$;

-- Backfill any existing auth users into public.users
insert into public.users (id, email, fullname, image_url, raw_user_meta_data, created_at, updated_at)
select
  au.id,
  au.email,
  coalesce(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    au.raw_user_meta_data->>'user_name',
    split_part(coalesce(au.email, 'User'), '@', 1)
  ),
  coalesce(
    au.raw_user_meta_data->>'avatar_url',
    au.raw_user_meta_data->>'picture',
    au.raw_user_meta_data->>'image_url',
    null
  ),
  coalesce(au.raw_user_meta_data, '{}'::jsonb),
  au.created_at,
  now()
from auth.users au
on conflict (id) do update set
  email = excluded.email,
  fullname = coalesce(excluded.fullname, public.users.fullname),
  image_url = coalesce(excluded.image_url, public.users.image_url),
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = now();

-- 3. Create public.chats table
create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  persona text not null check (persona in ('tech_bro', 'angry_gf')),
  title text not null default 'New Conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for chats
create index if not exists idx_chats_user_id on public.chats(user_id);
create index if not exists idx_chats_user_updated on public.chats(user_id, updated_at desc);

-- 4. Create public.messages table
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  data jsonb default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- Indexes for messages
create index if not exists idx_messages_chat_id on public.messages(chat_id);
create index if not exists idx_messages_chat_created on public.messages(chat_id, created_at asc);

-- 5. Trigger to touch chat updated_at on new message
create or replace function public.touch_chat_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.chats
  set updated_at = now()
  where id = new.chat_id;
  return new;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'on_message_touch_chat') then
    create trigger on_message_touch_chat
      after insert on public.messages
      for each row execute function public.touch_chat_updated_at();
  end if;
end $$;

-- 6. Enable Row-Level Security (RLS)
alter table public.users enable row level security;
alter table public.chats enable row level security;
alter table public.messages enable row level security;

-- Policies for public.users
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'users' and policyname = 'Users can view their own profile') then
    create policy "Users can view their own profile"
      on public.users for select
      using (id = (select auth.uid()));
  end if;

  if not exists (select 1 from pg_policies where tablename = 'users' and policyname = 'Users can update their own profile') then
    create policy "Users can update their own profile"
      on public.users for update
      using (id = (select auth.uid()));
  end if;

  -- Policies for public.chats
  if not exists (select 1 from pg_policies where tablename = 'chats' and policyname = 'Users can view their own chats') then
    create policy "Users can view their own chats"
      on public.chats for select
      using (user_id = (select auth.uid()));
  end if;

  if not exists (select 1 from pg_policies where tablename = 'chats' and policyname = 'Users can insert their own chats') then
    create policy "Users can insert their own chats"
      on public.chats for insert
      with check (user_id = (select auth.uid()));
  end if;

  if not exists (select 1 from pg_policies where tablename = 'chats' and policyname = 'Users can update their own chats') then
    create policy "Users can update their own chats"
      on public.chats for update
      using (user_id = (select auth.uid()));
  end if;

  if not exists (select 1 from pg_policies where tablename = 'chats' and policyname = 'Users can delete their own chats') then
    create policy "Users can delete their own chats"
      on public.chats for delete
      using (user_id = (select auth.uid()));
  end if;

  -- Policies for public.messages
  if not exists (select 1 from pg_policies where tablename = 'messages' and policyname = 'Users can view messages from their chats') then
    create policy "Users can view messages from their chats"
      on public.messages for select
      using (
        exists (
          select 1 from public.chats
          where chats.id = messages.chat_id
          and chats.user_id = (select auth.uid())
        )
      );
  end if;

  if not exists (select 1 from pg_policies where tablename = 'messages' and policyname = 'Users can insert messages into their chats') then
    create policy "Users can insert messages into their chats"
      on public.messages for insert
      with check (
        exists (
          select 1 from public.chats
          where chats.id = messages.chat_id
          and chats.user_id = (select auth.uid())
        )
      );
  end if;

  if not exists (select 1 from pg_policies where tablename = 'messages' and policyname = 'Users can delete messages from their chats') then
    create policy "Users can delete messages from their chats"
      on public.messages for delete
      using (
        exists (
          select 1 from public.chats
          where chats.id = messages.chat_id
          and chats.user_id = (select auth.uid())
        )
      );
  end if;
end $$;
