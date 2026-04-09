import Link from 'next/link';

export default function LandingPage() {
  return (
    <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', textAlign: 'center', padding: '2rem' }}>
      <h1 style={{ fontSize: '4rem', marginBottom: '1rem', background: 'linear-gradient(to right, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', color: 'transparent', fontWeight: 700 }}>MIND PROFIT</h1>
      <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', maxWidth: '600px', marginBottom: '2rem' }}>
        Predictive Analytics framework for early identification and prevention of business losses in small-scale industries using machine learning.
      </p>
      
      <div style={{ display: 'flex', gap: '1rem' }}>
        <Link href="/login" className="btn-primary">
          Login / Dashboard
        </Link>
        <Link href="/register" className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)' }}>
          Register an Account
        </Link>
      </div>
    </main>
  )
}
