'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteDocument(documentId: string, filePath: string) {
  const supabase = await createClient()

  try {
    // 1. Delete the physical file from Storage
    const { error: storageError } = await supabase.storage
      .from('cognis-files')
      .remove([filePath])

    if (storageError) throw new Error(`Storage error: ${storageError.message}`)

    // 2. Delete the row from 'documents' 
    // (document_chunks will auto-delete due to CASCADE)
    const { error: dbError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)

    if (dbError) throw new Error(`Database error: ${dbError.message}`)

    // 3. Refresh the sidebar UI
    revalidatePath('/dashboard')
    
    return { success: true }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Delete failed:', msg)
    return { success: false, error: msg }
  }
}