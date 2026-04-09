export default function UploadPage() {
  return (
    <div className="card" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
      <h2 style={{ marginBottom: '1.5rem' }}>Upload Historical Data</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Upload a CSV or Excel file to bulk import past business performance data.
      </p>
      
      <div style={{ border: '2px dashed var(--border-color)', padding: '3rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
        <input type="file" accept=".csv, .xlsx" style={{ cursor: 'pointer' }} />
      </div>
      
      <button className="btn-primary" style={{ width: '100%' }}>Process and Import</button>
    </div>
  )
}
