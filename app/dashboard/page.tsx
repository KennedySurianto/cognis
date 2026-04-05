import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { BrainCircuit, LogOut, FileText } from 'lucide-react'
import { UploadDialog } from '@/components/dashboard/upload-dialog'
import { ChatInterface } from '@/components/dashboard/chat-interface'
import { DeleteButton } from '@/components/dashboard/delete-button'

async function signOut() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  const { data: documents } = await supabase
    .from('documents')
    .select('id, file_name, created_at, file_path')
    .order('created_at', { ascending: false })

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">

      <aside className="w-80 flex-col border-r bg-white flex dark:bg-slate-900 shrink-0">
        <div className="flex h-16 items-center justify-between border-b px-4 shrink-0">
          <div className="flex items-center gap-2 font-bold text-lg">
            <BrainCircuit className="h-5 w-5 text-blue-600" />
            <span>Cognis</span>
          </div>
          <form action={signOut}>
            <Button variant="ghost" size="icon" title="Sign Out">
              <LogOut className="h-4 w-4" />
            </Button>
          </form>
        </div>

        <div className="p-4 border-b shrink-0">
          {/* Injecting the Client Component */}
          <UploadDialog userId={user.id} />
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            <h3 className="text-sm font-semibold text-slate-500 mb-4">Your Knowledge Base</h3>

            {documents && documents.length > 0 ? (
              documents.map((doc) => (
                <div
                  key={doc.id}
                  className="group flex items-center justify-between gap-3 rounded-lg border p-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-3 truncate">
                    <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                    <span className="text-sm font-medium truncate">{doc.file_name}</span>
                  </div>

                  {/* The Delete Trigger */}
                  <DeleteButton id={doc.id} path={doc.file_path} />
                </div>
              ))
            ) : (
              <div className="text-center p-4 border border-dashed rounded-lg text-slate-500 text-sm">
                No documents uploaded yet.
              </div>
            )}
          </div>
        </ScrollArea>
      </aside>

      {/* Injecting the Chat Interface Component */}
      <ChatInterface documents={documents || []} />

    </div>
  )
}