import { streamText, embed } from 'ai'
import { google } from '@ai-sdk/google'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Define the core message type manually to avoid version import conflicts
interface CoreMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface UIMessage {
  role: string;
  content?: string;
  parts?: Array<{ type: string; text?: string }>;
}

export const runtime = 'edge'

export async function POST(req: Request) {
  try {
    const { messages, selectedFileId }: { messages: UIMessage[], selectedFileId?: string } = await req.json()
    
    const latestMsg = messages[messages.length - 1]
    const latestMessageText = latestMsg?.content || (latestMsg?.parts?.[0]?.text ?? '')

    if (!latestMessageText) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Map to CoreMessage format
    const coreMessages: CoreMessage[] = messages.map((msg) => ({
      role: (msg.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
      content: msg.content || (msg.parts ? msg.parts.map(p => p.text || '').join('') : '')
    }))

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll() { /* Edge ignore */ },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Vector Search
    const { embedding } = await embed({
      model: google.embeddingModel('gemini-embedding-001'),
      value: latestMessageText,
    })

    const { data: chunks, error: matchError } = await supabase.rpc('match_document_chunks', {
      query_embedding: embedding,
      match_threshold: 0.3,
      match_count: 5,
      p_user_id: user.id,
      p_document_id: selectedFileId || null
    })

    if (matchError) throw new Error('Failed to retrieve context')

    const contextText = chunks?.map((chunk: { content: string }) => chunk.content).join('\n\n---\n\n') || 'No relevant documents found.'

    const systemPrompt = `
      You are Cognis, a strict Retrieval-Augmented Generation (RAG) assistant.
      
      CRITICAL RULE: You MUST ONLY answer using the "RETRIEVED CONTEXT" provided below. 
      If the RETRIEVED CONTEXT is empty or does not contain the answer, you MUST say: 
      "I'm sorry, but I don't have any information about those specific projects in your uploaded documents."
      
      DO NOT use your internal knowledge about John F. Kennedy, NASA, or any other global entities unless they are explicitly mentioned in the context below.

      RETRIEVED CONTEXT:
      ${contextText || "NO RELEVANT DOCUMENTS FOUND."}
    `

    const result = await streamText({
      model: google('gemini-flash-latest'),
      system: systemPrompt,
      messages: coreMessages,
      temperature: 0.1,
    })

    // Fix: Use the new method name for the Vercel AI SDK 6.x
    return result.toUIMessageStreamResponse()

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Chat API Error:', msg)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}