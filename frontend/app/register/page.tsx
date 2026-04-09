"use client"
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Register() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleRegister = async (e: any) => {
        e.preventDefault();
        const pwd = e.target.pwd.value;
        const cpwd = e.target.cpwd.value;
        if(pwd !== cpwd) {
            setError("Passwords do not match!");
            return;
        }
        setError("");
        setLoading(true);
        
        try {
            const payload = {
                company_name: e.target.company.value,
                owner_name: e.target.owner.value,
                username: e.target.email.value, // mapping email as username safely
                email: e.target.email.value,
                mobile_number: e.target.mobile.value,
                password: pwd
            };

            const res = await fetch('http://127.0.0.1:8000/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.detail || "Registration Failed.");
                setLoading(false);
                return;
            }
            router.push('/login');
        } catch (err) {
            setError("Cannot connect to server. Ensure backend is running.");
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '2rem' }}>
            <div className="card" style={{ maxWidth: '550px', width: '100%', padding: '2.5rem' }}>
                <h1 style={{ textAlign: 'center', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', color: 'transparent', marginBottom: '2rem', fontSize: '1.8rem' }}>MIND PROFIT</h1>
                <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--text-main)' }}>Create an Account</h2>
                <form onSubmit={handleRegister}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <input type="text" name="company" style={{ width: '100%', padding: '0.8rem', marginBottom: '1rem', background: '#0f172a', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff' }} placeholder="Company Name" required />
                        <input type="text" name="owner" style={{ width: '100%', padding: '0.8rem', marginBottom: '1rem', background: '#0f172a', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff' }} placeholder="Owner Name" required />
                    </div>
                    <input type="email" name="email" style={{ width: '100%', padding: '0.8rem', marginBottom: '1rem', background: '#0f172a', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff' }} placeholder="Email Address" required />
                    <input type="tel" name="mobile" style={{ width: '100%', padding: '0.8rem', marginBottom: '1rem', background: '#0f172a', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff' }} placeholder="Mobile Number" required />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <input type="password" name="pwd" style={{ width: '100%', padding: '0.8rem', marginBottom: '1rem', background: '#0f172a', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff' }} placeholder="Password" required />
                        <input type="password" name="cpwd" style={{ width: '100%', padding: '0.8rem', marginBottom: '1rem', background: '#0f172a', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff' }} placeholder="Confirm Password" required />
                    </div>
                    {error && <p style={{ color: 'var(--accent-red)', textAlign: 'center', marginBottom: '1rem' }}>{error}</p>}
                    <button type="submit" className="btn-primary" style={{ width: '100%', fontSize: '1.1rem' }}>{loading ? "Creating Profile..." : "Register Account"}</button>
                </form>
                <p style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-muted)' }}>
                    Already have an account? <a href="/login" style={{ color: 'var(--primary)' }}>Log in here</a>
                </p>
            </div>
        </div>
    );
}
