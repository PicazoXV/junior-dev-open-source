'use client'

import { createClient } from '@/lib/supabase/client'

type GitHubLoginButtonProps = {
  label?: string
  className?: string
}

export default function GitHubLoginButton({
  label = 'Continuar con GitHub',
  className = '',
}: GitHubLoginButtonProps) {
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
      className={`rounded-lg border border-orange-400/40 bg-orange-500/10 px-6 py-3 text-base font-medium text-orange-300 transition hover:border-orange-300 hover:bg-orange-500/15 ${className}`}
    >
      {label}
    </button>
  )
}
