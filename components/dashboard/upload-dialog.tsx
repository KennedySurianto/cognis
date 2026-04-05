'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { UploadCloud, Loader2, CheckCircle2 } from 'lucide-react'
import { processDocument } from '@/lib/ai/ingest'

export function UploadDialog({ userId }: { userId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setStatus('idle')

    try {
      // 1. Upload the raw file to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${crypto.randomUUID()}.${fileExt}`
      const filePath = `${userId}/${fileName}`

      const { error: storageError } = await supabase.storage
        .from('cognis-files')
        .upload(filePath, file)

      if (storageError) throw storageError

      // 2. Create a record in the documents database table
      const { data: docData, error: dbError } = await supabase
        .from('documents')
        .insert({
          user_id: userId,
          file_name: file.name,
          // Store the path so we can find it later
          file_path: filePath
        })
        .select('id')
        .single();

      if (dbError || !docData) throw dbError;

      // 3. THIS IS THE CRITICAL CALL
      console.log("Triggering AI Ingestion for:", docData.id);
      const result = await processDocument(docData.id, filePath);

      if (!result.success) {
        console.error("Ingestion failed:", result.error);
        throw new Error(result.error);
      }

      console.log("AI Ingestion finished successfully!");

      setStatus('success')

      // Refresh the server component to show the new document in the sidebar
      router.refresh()

      // Close modal after a short delay
      setTimeout(() => {
        setIsOpen(false)
        setStatus('idle')
      }, 1500)

    } catch (error: unknown) {
      console.error(error)
      setStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Failed to upload document')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full gap-2">
          <UploadCloud className="h-4 w-4" />
          Upload Document
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload a new document</DialogTitle>
          <DialogDescription>
            Add a PDF to your Second Brain. It will be securely stored and isolated to your account.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg bg-slate-50 dark:bg-slate-900/50">
          {status === 'success' ? (
            <div className="flex flex-col items-center text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-10 w-10 mb-2" />
              <p className="font-medium">Upload complete!</p>
            </div>
          ) : (
            <>
              <UploadCloud className="h-10 w-10 text-slate-400 mb-4" />
              <div className="relative">
                <Button disabled={isUploading} variant="secondary">
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    'Select PDF File'
                  )}
                </Button>
                {/* Invisible file input overlaid on the button */}
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleUpload}
                  disabled={isUploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
              {status === 'error' && (
                <p className="text-sm text-destructive mt-4 text-center">{errorMessage}</p>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}