'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (password !== confirmPassword) {
    return redirect('/register?error=Passwords do not match')
  }

  const supabase = await createClient()

  // In a real app, you might want to dynamically pass the site URL here,
  // but Supabase uses your default Site URL from the dashboard by default.
  const { error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    return redirect(`/register?error=${error.message}`)
  }

  // Redirect back to the register page with a success message
  redirect('/register?message=Check your email to continue')
}