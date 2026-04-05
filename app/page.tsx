import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BrainCircuit, Database, Zap, Shield, ArrowRight } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <header className="flex h-16 items-center justify-between border-b bg-white px-6 dark:bg-slate-950">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <BrainCircuit className="h-6 w-6 text-blue-600" />
          <span>Cognis</span>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link href="/login">
            <Button>Get Started</Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="px-6 py-24 text-center md:py-32 lg:py-40">
          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Your Enterprise <span className="text-blue-600">Second Brain</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
            Upload massive PDFs, images, and notes. Chat with your data instantly using advanced Retrieval-Augmented Generation (RAG) powered by Google Gemini and Supabase.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/login">
              <Button size="lg" className="h-12 px-8 text-base">
                Deploy Your Brain <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="https://github.com" target="_blank" rel="noreferrer">
              <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                View Architecture
              </Button>
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section className="border-t bg-white px-6 py-24 dark:bg-slate-900">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-12 md:grid-cols-3">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 rounded-full bg-blue-100 p-4 dark:bg-blue-900/20">
                  <Zap className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="mb-2 text-xl font-bold">Edge-Streaming AI</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Zero-latency responses streamed directly to the client via Vercel Edge Functions and the AI SDK.
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 rounded-full bg-blue-100 p-4 dark:bg-blue-900/20">
                  <Database className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="mb-2 text-xl font-bold">pgvector Search</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Lightning-fast semantic similarity search utilizing HNSW indexing in Supabase PostgreSQL.
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 rounded-full bg-blue-100 p-4 dark:bg-blue-900/20">
                  <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="mb-2 text-xl font-bold">Enterprise Security</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Strict multi-tenant data isolation guaranteed by Supabase Row Level Security (RLS).
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}