create table if not exists signal_turns (
  id serial primary key,
  user_id text not null,
  question text not null,
  sentence text not null,
  query text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists signal_turns_user_id_idx on signal_turns (user_id);
