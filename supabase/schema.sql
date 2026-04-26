-- ============================================================
-- 积分系统数据库 Schema
-- 在 Supabase SQL Editor 中执行此文件
-- ============================================================

-- 启用 UUID 扩展
create extension if not exists "uuid-ossp";

-- ============================================================
-- 表1: 孩子信息 (children)
-- ============================================================
create table if not exists children (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  avatar text not null,  -- 'mantou' | 'jiaozi'
  created_at timestamptz default now()
);

-- 初始数据
insert into children (id, name, avatar) values
  ('00000000-0000-0000-0000-000000000001', '馒头', 'mantou'),
  ('00000000-0000-0000-0000-000000000002', '饺子', 'jiaozi')
on conflict (id) do nothing;

-- ============================================================
-- 表2: 积分记录 (records)
-- ============================================================
create table if not exists records (
  id uuid primary key default uuid_generate_v4(),
  child_id uuid not null references children(id) on delete cascade,
  task_id text not null,
  task_name text not null,
  task_category text not null,
  points integer not null,         -- 正数=加分，负数=减分
  date text not null,              -- 'YYYY-MM-DD'
  created_at timestamptz default now()
);

-- 按孩子+日期建索引，加速查询
create index if not exists records_child_date_idx on records(child_id, date);

-- ============================================================
-- 表3: 兑换记录 (exchanges)
-- ============================================================
create table if not exists exchanges (
  id uuid primary key default uuid_generate_v4(),
  child_id uuid not null references children(id) on delete cascade,
  reward_name text not null,
  reward_points integer not null,
  date text not null,
  created_at timestamptz default now()
);

create index if not exists exchanges_child_date_idx on exchanges(child_id, date);

-- ============================================================
-- 启用 Realtime（让所有设备自动同步）
-- ============================================================
alter publication supabase_realtime add table records;
alter publication supabase_realtime add table exchanges;
alter publication supabase_realtime add table children;

-- ============================================================
-- Row Level Security（暂时关闭，方便家庭成员直接访问）
-- 如果以后需要权限控制，在这里开启
-- ============================================================
alter table children enable row level security;
alter table records enable row level security;
alter table exchanges enable row level security;

-- 家庭成员可读写所有数据（无限制版本）
create policy "allow_all_children" on children for all using (true) with check (true);
create policy "allow_all_records" on records for all using (true) with check (true);
create policy "allow_all_exchanges" on exchanges for all using (true) with check (true);
