-- 1. Enable the vector extension
create extension if not exists vector;

-- 2. Create the parent documents table
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  file_name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

ALTER TABLE documents 
ADD COLUMN file_path TEXT;

-- 3. Create the chunks table to hold the embedded text
create table if not exists document_chunks (
  id bigint primary key generated always as identity,
  document_id uuid references documents(id) on delete cascade not null,
  content text not null,
  embedding vector(768) not null, -- 768 is required for Gemini embeddings
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 1. Drop the existing column (this will delete current chunk data)
ALTER TABLE document_chunks 
DROP COLUMN embedding;

-- 2. Re-add it with the correct 3072 dimensions
ALTER TABLE document_chunks 
ADD COLUMN embedding vector(3072);

-- Replace 'document_chunks_document_id_fkey' with your actual constraint name if different
ALTER TABLE document_chunks
DROP CONSTRAINT IF EXISTS document_chunks_document_id_fkey,
ADD CONSTRAINT document_chunks_document_id_fkey
  FOREIGN KEY (document_id)
  REFERENCES documents(id)
  ON DELETE CASCADE;

-- 4. Create an HNSW index for sub-millisecond similarity search
-- This prevents the database from scanning every single row during a chat query
create index on document_chunks using hnsw (embedding vector_cosine_ops);



-- 1. Completely remove the old version (with the old return types)
DROP FUNCTION IF EXISTS match_document_chunks(vector, double precision, integer, uuid, uuid);

-- 2. Create the corrected version with the 'id bigint' return type
CREATE OR REPLACE FUNCTION match_document_chunks (
  query_embedding vector(3072),
  match_threshold float,
  match_count int,
  p_user_id uuid,
  p_document_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id bigint,       -- Matches your actual table structure
  content text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.content,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  JOIN documents d ON d.id = dc.document_id
  WHERE d.user_id = p_user_id
    AND (1 - (dc.embedding <=> query_embedding) > match_threshold)
    AND (p_document_id IS NULL OR dc.document_id = p_document_id)
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;



-- Enable RLS
alter table documents enable row level security;
alter table document_chunks enable row level security;

-- Policies for documents
create policy "Users can view their own documents"
on documents for select using (auth.uid() = user_id);

create policy "Users can insert their own documents"
on documents for insert with check (auth.uid() = user_id);

create policy "Users can delete their own documents"
on documents for delete using (auth.uid() = user_id);

-- Policies for document chunks
create policy "Users can view chunks of their own documents"
on document_chunks for select
using (document_id in (select id from documents where user_id = auth.uid()));

create policy "Users can insert chunks for their own documents"
on document_chunks for insert
with check (document_id in (select id from documents where user_id = auth.uid()));



-- 1. Allow authenticated users to upload files to the cognis-files bucket
create policy "Allow authenticated uploads"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'cognis-files' 
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- 2. Allow authenticated users to download/read their own files
create policy "Allow authenticated downloads"
on storage.objects for select
to authenticated
using (
  bucket_id = 'cognis-files' 
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- 3. Allow authenticated users to delete their own files (Optional but recommended)
create policy "Allow authenticated deletions"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'cognis-files' 
  and auth.uid()::text = (storage.foldername(name))[1]
);

SELECT count(*) FROM document_chunks;
SELECT * FROM documents;
select * from auth.users where id='eabd667e-afa1-48b0-8d4f-c8ba17730bd7';