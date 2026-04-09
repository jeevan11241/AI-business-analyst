"use client"
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const formData = new URLSearchParams();
            formData.append('username', email); // backend checks if this is mapped to an email
            formData.append('password', password);

            const res = await fetch('http://127.0.0.1:8000/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData.toString()
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.detail || "Authentication Failed. Use a registered email.");
                setLoading(false);
                return;
            }

            const data = await res.json();
            localStorage.setItem('token', data.access_token);
            // Save email for later alerting functions
            localStorage.setItem('userEmail', email);
            router.push('/dashboard');
        } catch (err) {
            setError("Cannot connect to server. Please ensure backend is running.");
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '2rem' }}>
            <div className="card" style={{ maxWidth: '450px', width: '100%', padding: '3rem' }}>
                <h1 style={{ textAlign: 'center', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', color: 'transparent', marginBottom: '2rem', fontSize: '2rem' }}>MIND PROFIT</h1>
                <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--text-main)' }}>Welcome Back</h2>
                <form onSubmit={handleLogin}>
                    <input type="email" style={{ width: '100%', padding: '0.9rem', marginBottom: '1rem', background: '#0f172a', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff' }} placeholder="Email Address" onChange={e => setEmail(e.target.value)} required />
                    <input type="password" style={{ width: '100%', padding: '0.9rem', marginBottom: '1.5rem', background: '#0f172a', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff' }} placeholder="Password" onChange={e => setPassword(e.target.value)} required />
                    {error && <p style={{ color: 'var(--accent-red)', textAlign: 'center', marginBottom: '1rem' }}>{error}</p>}
                    <button type="submit" className="btn-primary" style={{ width: '100%', fontSize: '1.1rem' }}>{loading ? "Authenticating..." : "Secure Login"}</button>
                </form>
                <p style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-muted)' }}>
                    Don't have an account? <a href="/register" style={{ color: 'var(--primary)' }}>Register here</a>
                </p>
            </div>
        </div>
    );
}
