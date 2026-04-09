export default function DataEntry() {
  return (
    <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1.5rem' }}>Manual Data Entry</h2>
      <form>
        <input className="input-field" type="text" placeholder="Business Name" required />
        <input className="input-field" type="date" placeholder="Date" required />
        <input className="input-field" type="number" placeholder="Total Sales" required />
        <input className="input-field" type="number" placeholder="Total Expenses" required />
        <input className="input-field" type="number" placeholder="Inventory Cost" required />
        <input className="input-field" type="number" placeholder="Salary Cost" required />
        <input className="input-field" type="number" placeholder="Customer Count" required />
        <textarea className="input-field" placeholder="Optional Notes" rows={4}></textarea>
        <button type="submit" className="btn-primary" style={{ width: '100%' }}>Save to Database & Predict Risk</button>
      </form>
    </div>
  )
}
