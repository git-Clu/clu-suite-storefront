-- 001_init.sql — S1 scope only: accounts, sub-users and portal sessions.
-- Forward-only and additive. Never edit an applied migration; add 002_*.sql instead.

create table if not exists schema_migrations (
  name        text primary key,
  applied_at  timestamptz not null default now()
);

create table if not exists accounts (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  -- Lowercased on write. Anti-enumeration compares against this unique index.
  email       text not null,
  status      text not null default 'active'
              check (status in ('active', 'suspended', 'closed')),
  created_at  timestamptz not null default now()
);

create unique index if not exists accounts_email_key on accounts (lower(email));

-- Sub-users share one account's licences. Roles are explicit; nothing tests role names.
create table if not exists account_users (
  id            uuid primary key default gen_random_uuid(),
  account_id    uuid not null references accounts (id) on delete cascade,
  email         text not null,
  role          text not null default 'member'
                check (role in ('owner', 'billing', 'member')),
  password_hash text,
  mfa_secret    text,
  mfa_last_step bigint not null default 0,
  verified_at   timestamptz,
  created_at    timestamptz not null default now()
);

create unique index if not exists account_users_email_key on account_users (account_id, lower(email));

-- Stateful sessions, unlike clu.gr's stateless admin cookie: the portal needs "sign out everywhere".
create table if not exists sessions (
  id               text primary key,              -- random, stored hashed in the cookie
  account_user_id  uuid not null references account_users (id) on delete cascade,
  created_at       timestamptz not null default now(),
  last_seen_at     timestamptz not null default now(),
  expires_at       timestamptz not null,
  ip_hash          text,
  ua_class         text,
  revoked_at       timestamptz
);

create index if not exists sessions_user_idx on sessions (account_user_id) where revoked_at is null;
create index if not exists sessions_expiry_idx on sessions (expires_at);
