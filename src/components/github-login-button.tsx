'use client'

import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n/client'

type GitHubLoginButtonProps = {
  label?: string
  className?: string
}

export default function GitHubLoginButton({
  label,
  className = '',
}: GitHubLoginButtonProps) {
  const { locale } = useI18n()
  const safeLabel = label || (locale === 'en' ? 'Continue with GitHub' : 'Continuar con GitHub')

  const handleLogin = async () => {
    const supabase = createClient()
    const redirectTo = new URL('/auth/callback', window.location.origin).toString()

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo,
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
      {safeLabel}
    </button>
  )
}
