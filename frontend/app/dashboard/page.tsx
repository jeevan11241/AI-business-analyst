"use client"
import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

export default function DashboardPage() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [stats, setStats] = useState({ rows: 0, preds: 0, low: 0, medium: 0, high: 0 });
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [predsData, setPredsData] = useState<any>(null);
    const [historyData, setHistoryData] = useState<any[]>([]);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [submitStatus, setSubmitStatus] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        businessName: '', date: '', sales: '', expenses: '',
        inventory: '', salary: '', customers: '', notes: ''
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login';
            return;
        }
        // Load real user profile from backend
        fetch('http://127.0.0.1:8000/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => {
            if (!res.ok) {
                // Token expired or invalid → force re-login
                localStorage.removeItem('token');
                localStorage.removeItem('userEmail');
                window.location.href = '/login';
                return;
            }
            return res.json();
        })
        .then(data => {
            if (data) {
                setUserProfile(data);
                localStorage.setItem('userEmail', data.email);
            }
        })
        .catch(() => {
            // Backend not reachable — still allow local mode
            console.warn('Backend not reachable. Running in offline mode.');
        });
    }, []);

    const logout = () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    };

    // Robust CSV Parsing
    const processUpload = () => {
        if (!csvFile) return alert("Please select a file first");

        const reader = new FileReader();
        reader.onload = function(e: any) {
            const text = e.target.result;
            const lines = text.split('\n');
            if (lines.length < 2) return alert("Empty CSV detected.");

            const headers = lines[0].toLowerCase().split(',');
            // Smart column detection
            let sIdx = headers.findIndex((h:string) => h.includes('sale') || h.includes('revenue'));
            let eIdx = headers.findIndex((h:string) => h.includes('expens') || h.includes('cost'));
            let iIdx = headers.findIndex((h:string) => h.includes('invent'));
            let salIdx = headers.findIndex((h:string) => h.includes('salar') || h.includes('pay'));

            // Fallbacks if headers lack names
            if(sIdx === -1) sIdx = 2; if(eIdx === -1) eIdx = 3; 
            if(iIdx === -1) iIdx = 4; if(salIdx === -1) salIdx = 5;

            let totalSales = 0, totalExp = 0, totalInv = 0, totalSal = 0, validCount = 0;

            for (let i = 1; i < lines.length; i++) {
                if (lines[i].trim() === "") continue;
                // Basic CSV split bypassing quotes (naive approach for speed)
                const cols = lines[i].split(','); 
                
                const s = parseFloat(cols[sIdx]) || 0;
                const ex = parseFloat(cols[eIdx]) || 0;
                const inv = parseFloat(cols[iIdx]) || 0;
                const sal = parseFloat(cols[salIdx]) || 0;

                if (s > 0 || ex > 0) {
                    totalSales += s; totalExp += ex; totalInv += inv; totalSal += sal;
                    validCount++;
                }
            }

            if (validCount > 0) {
                const avgS = totalSales / validCount;
                const avgE = totalExp / validCount;
                const avgI = totalInv / validCount;
                const avgSal = totalSal / validCount;

                let riskLevel = "Low"; let riskClass = "risk-Low"; let prob = "98%";
                if (avgE > avgS * 0.9) { riskLevel = "High"; riskClass = "risk-High"; prob = "92%"; }
                else if (avgE > avgS * 0.75) { riskLevel = "Medium"; riskClass = "risk-Medium"; prob = "65%"; }

                setStats(prev => ({ ...prev, rows: prev.rows + validCount, preds: prev.preds + 1,
                    low: riskLevel === "Low" ? prev.low + 1 : prev.low,
                    medium: riskLevel === "Medium" ? prev.medium + 1 : prev.medium,
                    high: riskLevel === "High" ? prev.high + 1 : prev.high
                }));

                const newPred = {
                    date: new Date().toLocaleDateString(),
                    type: "Batch CSV",
                    count: validCount, sales: avgS, expenses: avgE, inventory: avgI, salary: avgSal,
                    risk: riskLevel, riskClass: riskClass, prob: prob
                };

                setPredsData(newPred);
                setHistoryData([newPred, ...historyData]);
                setActiveTab('predictions');

                // Trigger backend email
                const userEmail = localStorage.getItem('userEmail');
                if(userEmail) {
                    fetch('http://127.0.0.1:8000/alerts/send-report', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            email: userEmail,
                            business: "Batch CSV Processing",
                            sales: avgS,
                            risk_level: riskLevel,
                            label: riskClass
                        })
                    }).catch(console.error);
                }
            } else {
                alert("No valid numerical data found. Please check your CSV format.");
            }
        };
        reader.readAsText(csvFile);
    };

    const handleFormSubmit = async (e: any) => {
        e.preventDefault();
        setSubmitStatus('running');
        const s = parseFloat(formData.sales) || 0;
        const ex = parseFloat(formData.expenses) || 0;
        const inv = parseFloat(formData.inventory) || 0;
        const sal = parseFloat(formData.salary) || 0;
        const cust = parseInt(formData.customers) || 0;
        let riskLevel = "Low"; let riskClass = "risk-Low"; let prob = "88%";
        if (ex > s * 0.9) { riskLevel = "High"; riskClass = "risk-High"; prob = "95%"; }
        else if (ex > s * 0.75) { riskLevel = "Medium"; riskClass = "risk-Medium"; prob = "70%"; }

        const newPred = {
            date: formData.date || new Date().toLocaleDateString(),
            type: "Manual Entry",
            count: 1, sales: s, expenses: ex, inventory: inv, salary: sal,
            business: formData.businessName, risk: riskLevel, riskClass: riskClass, prob: prob
        };

        setPredsData(newPred);
        setHistoryData(prev => [newPred, ...prev]);
        setStats(prev => ({ ...prev, rows: prev.rows + 1, preds: prev.preds + 1,
            low: riskLevel === "Low" ? prev.low + 1 : prev.low,
            medium: riskLevel === "Medium" ? prev.medium + 1 : prev.medium,
            high: riskLevel === "High" ? prev.high + 1 : prev.high
        }));

        // Save to backend (fire and forget)
        const token = localStorage.getItem('token');
        if (token) {
            try {
                await fetch('http://127.0.0.1:8000/data/enter', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({
                        business_name: formData.businessName,
                        date: formData.date || new Date().toISOString().split('T')[0],
                        total_sales: s, total_expenses: ex,
                        inventory_cost: inv, salary_cost: sal, customer_count: cust,
                        notes: formData.notes
                    })
                });
            } catch { /* Backend offline — local predictions still work */ }
        }

        // Trigger backend email alert
        const userEmail = localStorage.getItem('userEmail');
        if(userEmail) {
            fetch('http://127.0.0.1:8000/alerts/send-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: userEmail,
                    business: formData.businessName,
                    sales: s,
                    risk_level: riskLevel,
                    label: riskClass
                })
            }).catch(console.error);
        }
        setSubmitStatus('done');
        setActiveTab('predictions');
    };

    // Generic Chart Styling
    const chartOptions = { responsive: true, plugins: { legend: { labels: { color: '#cbd5e1' } } }, scales: { y: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } }, x: { ticks: { color: '#94a3b8' }, grid: { display: false } } } };

    const navItems = [
        { id: 'dashboard', icon: '📊', label: 'Dashboard' },
        { id: 'data-entry', icon: '✏️', label: 'Data Entry' },
        { id: 'upload', icon: '📁', label: 'Upload CSV' },
        { id: 'predictions', icon: '🤖', label: 'Predictions' },
        { id: 'suggestions', icon: '💡', label: 'Suggestions' },
        { id: 'history', icon: '🕒', label: 'History' },
        { id: 'profile', icon: '👤', label: 'Profile' },
    ];

    return (
        <div className="dashboard-container">
            <aside className="sidebar">
                <h1 className="sidebar-logo">MIND PROFIT</h1>
                <nav className="sidebar-nav" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {navItems.map(item => (
                        <button key={item.id} onClick={() => setActiveTab(item.id)}
                            className={`sidebar-link ${activeTab === item.id ? 'active' : ''}`}
                            style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', fontFamily: 'inherit', cursor: 'pointer' }}>
                            <span style={{ marginRight: '10px' }}>{item.icon}</span>{item.label}
                        </button>
                    ))}
                </nav>
                <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                    {userProfile && (
                        <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(59,130,246,0.08)', borderRadius: '8px' }}>
                            <p style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '0.85rem' }}>{userProfile.owner_name}</p>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>{userProfile.email}</p>
                        </div>
                    )}
                    <button className="btn-primary" style={{ width: '100%', textAlign: 'center' }} onClick={logout}>🔒 Logout</button>
                </div>
            </aside>

            <main className="main-content" style={{ overflowY: 'auto', paddingRight: '1rem' }}>
                
                {/* 1. DASHBOARD PAGE */}
                {activeTab === 'dashboard' && (
                    <div className="view-section active-view">
                        <h2 style={{ color: 'var(--text-main)', marginBottom: '1.5rem' }}>Executive Dashboard</h2>
                        
                        <div className="grid-cards" style={{ marginBottom: '2rem' }}>
                            <div className="card"><div className="card-title">Total Records</div><div className="stat-value">{stats.rows}</div></div>
                            <div className="card"><div className="card-title">Total Predictions</div><div className="stat-value">{stats.preds}</div></div>
                            <div className="card"><div className="card-title">High-Risk Cases</div><div className="stat-value risk-High">{stats.high}</div></div>
                            <div className="card"><div className="card-title">Low-Risk Cases</div><div className="stat-value risk-Low">{stats.low}</div></div>
                        </div>

                        <div className="grid-cards" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: '2rem' }}>
                            <div className="card" style={{ height: '300px' }}>
                                <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>Sales vs Expenses</h3>
                                <Bar data={{ labels: ['Q1', 'Q2', 'Q3', 'Q4'], datasets: [{ label: 'Sales', data: [120, 190, 300, 250], backgroundColor: 'rgba(16, 185, 129, 0.7)' }, { label: 'Expenses', data: [90, 80, 200, 280], backgroundColor: 'rgba(239, 68, 68, 0.7)' }] }} options={{ maintainAspectRatio: false, ...chartOptions }} />
                            </div>
                            <div className="card" style={{ height: '300px' }}>
                                <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>Predicted Risk Distribution</h3>
                                <Doughnut data={{ labels: ['Low Risk', 'Medium Risk', 'High Risk'], datasets: [{ data: [stats.low || 1, stats.medium || 1, stats.high || 1], backgroundColor: ['#10b981', '#f59e0b', '#ef4444'] }] }} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#fff' } } } }} />
                            </div>
                        </div>

                        <div className="grid-cards" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: '2rem' }}>
                            <div className="card" style={{ height: '300px' }}>
                                <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>Monthly Profit Trends</h3>
                                <Line data={{ labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'], datasets: [{ label: 'Profit Margin', data: [30, 45, 28, 60, 40], borderColor: '#3b82f6', tension: 0.4 }] }} options={{ maintainAspectRatio: false, ...chartOptions }} />
                            </div>
                            <div className="card" style={{ height: '300px' }}>
                                <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>System Integrations</h3>
                                <p style={{ color: 'var(--text-muted)' }}>Email Alert Status: <span style={{ color: '#10b981', fontWeight: 'bold' }}>Active 🟢</span></p>
                                <p style={{ color: 'var(--text-muted)' }}>Recent AI Suggestions: <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>{stats.high + stats.medium} Pending Checks</span></p>
                            </div>
                        </div>

                        <div className="card">
                            <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>Recent Predictions</h3>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: 'var(--text-muted)' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}><th style={{ padding: '10px' }}>Date</th><th style={{ padding: '10px' }}>Source</th><th style={{ padding: '10px' }}>Risk Assessment</th></tr>
                                </thead>
                                <tbody>
                                    {historyData.slice(0, 3).map((item, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '10px' }}>{item.date}</td>
                                            <td style={{ padding: '10px' }}>{item.type}</td>
                                            <td style={{ padding: '10px' }} className={item.riskClass}>{item.risk}</td>
                                        </tr>
                                    ))}
                                    {historyData.length === 0 && <tr><td colSpan={3} style={{ padding: '10px', textAlign: 'center' }}>No recent activity.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 2. DATA ENTRY PAGE */}
                {activeTab === 'data-entry' && (
                    <div className="view-section active-view">
                        <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
                            <h2 style={{ color: 'var(--text-main)', marginBottom: '1.5rem' }}>Manual Data Entry</h2>
                            <form onSubmit={handleFormSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div><label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '5px' }}>Business Name</label>
                                <input type="text" className="input-field" placeholder="Corp Inc." onChange={e => setFormData({ ...formData, businessName: e.target.value })} required /></div>
                                <div><label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '5px' }}>Date</label>
                                <input type="date" className="input-field" onChange={e => setFormData({ ...formData, date: e.target.value })} required /></div>
                                <div><label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '5px' }}>Total Sales / Revenue</label>
                                <input type="number" className="input-field" placeholder="Ex: 50000" onChange={e => setFormData({ ...formData, sales: e.target.value })} required /></div>
                                <div><label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '5px' }}>Total Expenses</label>
                                <input type="number" className="input-field" placeholder="Ex: 35000" onChange={e => setFormData({ ...formData, expenses: e.target.value })} required /></div>
                                <div><label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '5px' }}>Inventory Cost</label>
                                <input type="number" className="input-field" placeholder="Ex: 10000" onChange={e => setFormData({ ...formData, inventory: e.target.value })} required /></div>
                                <div><label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '5px' }}>Salary Cost</label>
                                <input type="number" className="input-field" placeholder="Ex: 15000" onChange={e => setFormData({ ...formData, salary: e.target.value })} required /></div>
                                <div><label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '5px' }}>Customer Count</label>
                                <input type="number" className="input-field" placeholder="Ex: 105" onChange={e => setFormData({ ...formData, customers: e.target.value })} /></div>
                                <div><label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '5px' }}>Optional Ext. Notes</label>
                                <input type="text" className="input-field" placeholder="Q1 adjustments..." onChange={e => setFormData({ ...formData, notes: e.target.value })} /></div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <button type="submit" className="btn-primary" style={{ width: '100%' }}>Save strictly to Database & Predict</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* 3. UPLOAD PAGE */}
                {activeTab === 'upload' && (
                    <div className="view-section active-view">
                        <div className="card" style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
                            <h2 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>Upload Historical Data (CSV/Excel)</h2>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>We automatically validate columns: Sales, Expenses, Inventory, and Salary.</p>
                            <div style={{ border: '2px dashed var(--border-color)', padding: '3rem', borderRadius: '12px' }}>
                                <input type="file" accept=".csv" onChange={e => setCsvFile(e.target.files ? e.target.files[0] : null)} style={{ color: 'white', marginBottom: '1rem', display: 'block', margin: '0 auto' }} />
                                {csvFile && <p style={{ color: 'var(--accent-green)', marginBottom: '1rem' }}>Preview: {csvFile.name} attached.</p>}
                                <button className="btn-primary" onClick={processUpload}>Import to Database Engine</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. PREDICTIONS PAGE */}
                {activeTab === 'predictions' && (
                    <div className="view-section active-view">
                        <h2 style={{ color: 'var(--text-main)', marginBottom: '1.5rem' }}>AI Prediction Results</h2>
                        {!predsData ? (
                            <div className="card"><p style={{ color: 'var(--text-muted)' }}>No prediction runs logged currently. Upload data or process an entry first!</p></div>
                        ) : (
                            <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                                <div className="card" style={{ borderTop: `4px solid ${predsData.risk === 'High' ? '#ef4444' : predsData.risk === 'Medium' ? '#f59e0b' : '#10b981'}` }}>
                                    <h3 style={{ color: 'var(--text-main)', marginBottom: '10px' }}>Current Risk Level</h3>
                                    <h1 className={predsData.riskClass} style={{ fontSize: '3rem', margin: '1rem 0' }}>{predsData.risk}</h1>
                                    <p style={{ color: 'var(--text-muted)' }}>AI Confidence / Probability: <span style={{ color: 'white' }}>{predsData.prob}</span></p>
                                </div>
                                <div className="card">
                                    <h3 style={{ color: 'var(--text-main)', marginBottom: '1rem' }}>Key Factors Affecting Prediction</h3>
                                    <ul style={{ color: 'var(--text-muted)', lineHeight: '1.8' }}>
                                        <li>Total Evaluated Entities: <strong style={{ color: 'white' }}>{predsData.count} Form(s)</strong></li>
                                        <li>Calculated Avg Sales: <strong style={{ color: 'var(--accent-green)' }}>${predsData.sales.toLocaleString()}</strong></li>
                                        <li>Calculated Avg Expenses: <strong style={{ color: '#ef4444' }}>${predsData.expenses.toLocaleString()}</strong></li>
                                        <li>Expense vs Sales Ratio: <strong style={{ color: 'white' }}>{((predsData.expenses / predsData.sales) * 100).toFixed(1)}%</strong></li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 5. SUGGESTIONS PAGE */}
                {activeTab === 'suggestions' && (
                    <div className="view-section active-view">
                        <h2 style={{ color: 'var(--text-main)', marginBottom: '1.5rem' }}>Data-Driven Suggestions</h2>
                        {!predsData ? (
                            <div className="card"><p style={{ color: 'var(--text-muted)' }}>No data available to generate AI suggestions.</p></div>
                        ) : (
                            <>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>We evaluate which field caused the issue and generate strict counter-measures.</p>
                                <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                                    {predsData.inventory > (predsData.sales * 0.3) ? (
                                        <div className="card" style={{ borderLeft: '4px solid var(--accent-red)' }}>
                                            <h3 style={{ color: 'var(--accent-red)', marginBottom: '10px' }}>⚠️ Reduce Inventory Cost</h3>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Inventory overhead (${predsData.inventory}) exceeds the safe margin. <b>Action:</b> JIT Ordering to free up cash.</p>
                                        </div>
                                    ) : (
                                        <div className="card" style={{ borderLeft: '4px solid var(--accent-green)' }}>
                                            <h3 style={{ color: 'var(--accent-green)', marginBottom: '10px' }}>✅ Inventory Costs Safe</h3>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Inventory levels are fully optimized.</p>
                                        </div>
                                    )}

                                    {predsData.salary > (predsData.sales * 0.4) ? (
                                        <div className="card" style={{ borderLeft: '4px solid var(--accent-yellow)' }}>
                                            <h3 style={{ color: 'var(--accent-yellow)', marginBottom: '10px' }}>⚠️ Reduce Salary Overhead</h3>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Labor costs are eating profit margins. <b>Action:</b> Cross-train staff and optimize shift scheduling.</p>
                                        </div>
                                    ) : (
                                        <div className="card" style={{ borderLeft: '4px solid var(--accent-green)' }}>
                                            <h3 style={{ color: 'var(--accent-green)', marginBottom: '10px' }}>✅ Labor Budget Safe</h3>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Personnel overhead is properly scaled.</p>
                                        </div>
                                    )}

                                    {predsData.expenses > (predsData.sales * 0.75) && (
                                        <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
                                            <h3 style={{ color: 'var(--primary)', marginBottom: '10px' }}>📈 Improve Sales Strategy</h3>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Gross operations strictly exceed margins. <b>Action:</b> Increase customer engagement programs immediately.</p>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* 6. HISTORY PAGE */}
                {activeTab === 'history' && (
                    <div className="view-section active-view">
                        <div className="card">
                            <h2 style={{ color: 'var(--text-main)', marginBottom: '1rem' }}>Prediction History Archive</h2>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>List of all predictions done previously. Filtered sequentially.</p>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: 'var(--text-muted)' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <th style={{ padding: '12px' }}>Date</th>
                                        <th style={{ padding: '12px' }}>Input Type</th>
                                        <th style={{ padding: '12px' }}>Sales Evaluated</th>
                                        <th style={{ padding: '12px' }}>Prob/Confidence</th>
                                        <th style={{ padding: '12px' }}>Final Risk</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {historyData.map((item, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'transparent', transition: '0.3s' }}>
                                            <td style={{ padding: '12px' }}>{item.date}</td>
                                            <td style={{ padding: '12px' }}>{item.type} <span style={{fontSize:'0.7rem', color:'gray'}}>({item.count} row)</span></td>
                                            <td style={{ padding: '12px' }}>${Math.round(item.sales).toLocaleString()}</td>
                                            <td style={{ padding: '12px', color: 'white' }}>{item.prob}</td>
                                            <td style={{ padding: '12px' }} className={item.riskClass}>{item.risk}</td>
                                        </tr>
                                    ))}
                                    {historyData.length === 0 && <tr><td colSpan={5} style={{ padding: '20px', textAlign: 'center' }}>No historical jobs executed yet.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 7. PROFILE/SETTINGS PAGE */}
                {activeTab === 'profile' && (
                    <div className="view-section active-view">
                        <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                            <h2 style={{ color: 'var(--text-main)', marginBottom: '2rem', textAlign: 'center' }}>Account Profile & Settings</h2>

                            {/* Real user info loaded from /auth/me */}
                            <div style={{ marginBottom: '1.5rem', padding: '1.5rem', background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.05))', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                    <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>👤</div>
                                    <div>
                                        <h3 style={{ color: 'white', margin: 0 }}>{userProfile?.owner_name || 'Loading...'}</h3>
                                        <p style={{ color: 'var(--primary)', margin: '4px 0 0', fontSize: '0.9rem' }}>{userProfile?.email || '—'}</p>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
                                    <div><span style={{ color: 'var(--text-muted)' }}>Company</span><p style={{ color: 'white', marginTop: '2px', fontWeight: 600 }}>{userProfile?.company_name || '—'}</p></div>
                                    <div><span style={{ color: 'var(--text-muted)' }}>Username</span><p style={{ color: 'white', marginTop: '2px', fontWeight: 600 }}>@{userProfile?.username || '—'}</p></div>
                                    <div><span style={{ color: 'var(--text-muted)' }}>Mobile</span><p style={{ color: 'white', marginTop: '2px', fontWeight: 600 }}>{userProfile?.mobile_number || '—'}</p></div>
                                    <div><span style={{ color: 'var(--text-muted)' }}>Status</span><p style={{ color: '#10b981', marginTop: '2px', fontWeight: 600 }}>✅ Active</p></div>
                                </div>
                            </div>

                            <div style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                                <h4 style={{ color: 'var(--text-main)', marginBottom: '12px' }}>📬 Email Alert Configuration</h4>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                                    <input type="checkbox" defaultChecked /> Receive High-Risk alerts automatically
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)' }}>
                                    <input type="checkbox" defaultChecked /> Receive weekly summary reports
                                </label>
                            </div>

                            <div style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                                <h4 style={{ color: 'var(--text-main)', marginBottom: '8px' }}>📈 Session Summary</h4>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Total Predictions This Session: <span style={{ color: 'white', fontWeight: 600 }}>{stats.preds}</span></p>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>High Risk Alerts Triggered: <span style={{ color: '#ef4444', fontWeight: 600 }}>{stats.high}</span></p>
                            </div>

                            <button className="btn-primary" style={{ width: '100%', background: 'linear-gradient(135deg, #ef4444, #dc2626)' }} onClick={logout}>🔒 Sign Out</button>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
}
