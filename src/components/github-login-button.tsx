'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n/client'

type GitHubLoginButtonProps = {
  label?: string
  className?: string
  nextPath?: string
}

export default function GitHubLoginButton({
  label,
  className = '',
  nextPath,
}: GitHubLoginButtonProps) {
  const { locale } = useI18n()
  const [isLoading, setIsLoading] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const safeLabel = label || (locale === 'en' ? 'Continue with GitHub' : 'Continuar con GitHub')
  const safeNextPath =
    nextPath && nextPath.startsWith('/') && !nextPath.startsWith('//') ? nextPath : undefined

  const handleLogin = async () => {
    setFeedback(null)
    setIsLoading(true)

    try {
      const supabase = createClient()
      const redirectUrl = new URL('/auth/callback', window.location.origin)

      if (safeNextPath) {
        redirectUrl.searchParams.set('next', safeNextPath)
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: redirectUrl.toString(),
        },
      })

      if (error) {
        setFeedback(locale === 'en' ? 'Unable to start GitHub login. Try again.' : 'No se pudo iniciar el login con GitHub. Inténtalo de nuevo.')
        setIsLoading(false)
        console.error('Error al iniciar sesión con GitHub:', error.message)
        return
      }

      setFeedback(locale === 'en' ? 'Redirecting to GitHub...' : 'Redirigiendo a GitHub...')
    } catch (error) {
      setFeedback(
        locale === 'en'
          ? 'Login is unavailable right now. Check configuration and try again.'
          : 'El login no está disponible ahora mismo. Revisa la configuración e inténtalo de nuevo.'
      )
      setIsLoading(false)
      console.error(
        'Error de configuración de Supabase en cliente:',
        error instanceof Error ? error.message : String(error)
      )
    }
  }

  return (
    <div className="flex max-w-full flex-col gap-2">
      <button
        type="button"
        onClick={handleLogin}
        disabled={isLoading}
        className={`cursor-pointer rounded-lg border border-orange-400/40 bg-orange-500/10 px-6 py-3 text-base font-medium text-orange-300 transition hover:border-orange-300 hover:bg-orange-500/15 disabled:cursor-not-allowed disabled:opacity-80 ${className}`}
      >
        {isLoading
          ? locale === 'en'
            ? 'Connecting...'
            : 'Conectando...'
          : safeLabel}
      </button>
      {feedback ? (
        <p className="text-xs text-gray-300" aria-live="polite">
          {feedback}
        </p>
      ) : null}
    </div>
  )
}
