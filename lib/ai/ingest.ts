'use server'

import { createClient } from '@/lib/supabase/server'
import { embedMany } from 'ai'
import { google } from '@ai-sdk/google'
import pdf from 'pdf-parse-fork'

// Define the interface for the parser output
interface PdfData {
  text: string;
  numpages: number;
  info: Record<string, unknown>;
  metadata: unknown;
  version: string;
}

function chunkText(text: string, chunkSize = 1000, overlap = 200): string[] {
  const chunks: string[] = []
  let i = 0
  while (i < text.length) {
    chunks.push(text.slice(i, i + chunkSize))
    i += chunkSize - overlap
  }
  return chunks
}

export async function processDocument(documentId: string, filePath: string) {
  // Check your terminal for this log!
  console.log('🔵 Starting Ingestion for:', filePath);
  
  const supabase = await createClient()

  try {
    // 1. Download from Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('cognis-files')
      .download(filePath)

    if (downloadError || !fileData) {
      console.error('❌ Storage Download Error:', downloadError);
      return { success: false, error: 'Storage download failed' };
    }

    // 2. Extract Text using the fork
    const buffer = Buffer.from(await fileData.arrayBuffer());
    const data: PdfData = await pdf(buffer);
    
    const rawText = data.text?.trim();

    if (!rawText) {
      console.error('❌ Extraction Error: No text found in PDF.');
      return { success: false, error: 'PDF appears to be empty or a scanned image.' };
    }
    
    console.log('✅ Text Extracted. Length:', rawText.length);

    // 3. Chunking
    const chunks = chunkText(rawText);
    console.log('✅ Chunks Created:', chunks.length);

    // 4. Gemini Embeddings
    console.log('⏳ Generating Embeddings...');
    const { embeddings } = await embedMany({
      model: google.textEmbeddingModel('gemini-embedding-001'),
      values: chunks,
    });

    // 5. Database Insert
    const records = chunks.map((content, index) => ({
      document_id: documentId,
      content,
      embedding: embeddings[index],
    }));

    const { error: insertError } = await supabase
      .from('document_chunks')
      .insert(records);

    if (insertError) {
      console.error('❌ Database Insert Error:', insertError.message);
      return { success: false, error: insertError.message };
    }

    console.log('🚀 SUCCESS: Ingestion complete.');
    return { success: true, chunksProcessed: chunks.length };

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('❌ Fatal Ingestion Error:', msg);
    return { success: false, error: msg };
  }
}