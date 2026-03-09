'use client'

import { createClient } from '@/lib/supabase/client'

export default function GitHubLoginButton() {
  const handleLogin = async () => {
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: 'http://localhost:3000/auth/callback',
      },
    })

    if (error) {
      console.error('Error al iniciar sesión con GitHub:', error.message)
    }
  }

  return (
    <button
      onClick={handleLogin}
      className="rounded-xl bg-black px-4 py-2 text-white"
    >
      Continuar con GitHub
    </button>
  )
}