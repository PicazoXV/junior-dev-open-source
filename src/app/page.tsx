import GitHubLoginButton from '@/components/auth/github-login-button'

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="space-y-4 text-center">
        <h1 className="text-3xl font-bold">Junior Dev Open Source</h1>
        <p>Conecta tu GitHub y empieza a colaborar.</p>
        <GitHubLoginButton />
      </div>
    </main>
  )
}