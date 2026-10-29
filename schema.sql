-- ZipPrep Mock Tests schema (Supabase SQL Editor)
-- Apply only after reviewing your existing project policies and backups.
create extension if not exists pgcrypto;
create table if not exists public.mock_questions (
 id uuid primary key default gen_random_uuid(),
 exam text not null,
 subject text not null,
 question text not null,
 options jsonb not null check (jsonb_typeof(options)='array' and jsonb_array_length(options)>=2),
 correct_index integer not null check (correct_index>=0),
 explanation text not null default '',
 source_label text not null default 'curated',
 source_reference text,
 is_published boolean not null default false,
 created_at timestamptz not null default now(),
 constraint correct_index_in_options check (correct_index < jsonb_array_length(options))
);
create index if not exists mock_questions_exam_subject_idx on public.mock_questions(exam,subject) where is_published=true;
alter table public.mock_questions enable row level security;
-- Public can read only published question text. Do not expose answer keys through this table in a production exam.
-- Recommended production design: split public question/options into mock_question_public and answer key into private table
-- or return questions through a server function which withholds correct_index until submission.
drop policy if exists "Public can read published mock questions" on public.mock_questions;
create policy "Public can read published mock questions" on public.mock_questions for select using (is_published=true);
-- This MVP intentionally does not create a public-write attempts table. Add authenticated attempts later with per-user RLS.
