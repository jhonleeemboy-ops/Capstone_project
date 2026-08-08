import { useState, useEffect } from "react";
import axios from "axios";

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [product, setProduct] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    axios.get("http://127.0.0.1:5000/sales")
      .then(res => setSales(res.data))
      .catch(err => console.error(err));
  }, []);

  const handleSubmit = () => {
    if (!product || !amount || !date) return;
    axios.post("http://127.0.0.1:5000/sales", { product, amount, date })
      .then(res => {
        setSales([...sales, res.data.sale]);
        setProduct("");
        setAmount("");
        setDate("");
      });
  };

  const handleDelete = (id) => {
    axios.delete(`http://127.0.0.1:5000/sales/${id}`)
      .then(() => setSales(sales.filter(s => s.id !== id)));
  };

  return (
    <div style={{ maxWidth: 750 }}>
      <h1 style={{ fontSize: 22, marginBottom: "1.5rem" }}>Sales Records</h1>

      {/* Add Sale Form */}
      <div style={{ background: "#f5f5f5", padding: "1rem", borderRadius: 10, marginBottom: "2rem" }}>
        <h2 style={{ fontSize: 15, marginBottom: "1rem" }}>Add New Sale</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            placeholder="Product name"
            value={product}
            onChange={e => setProduct(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #ddd", flex: 1, minWidth: 150 }}
          />
          <input
            placeholder="Amount (₱)"
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #ddd", width: 130 }}
          />
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #ddd" }}
          />
          <button
            onClick={handleSubmit}
            style={{ padding: "8px 16px", background: "#378ADD", color: "white", border: "none", borderRadius: 6, cursor: "pointer" }}
          >
            Add Sale
          </button>
        </div>
      </div>

      {/* Sales Table */}
      <div style={{ border: "1px solid #eee", borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead style={{ background: "#f9f9f9" }}>
            <tr>
              {["#", "Product", "Amount (₱)", "Date", "Action"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "10px 14px", borderBottom: "1px solid #eee", color: "#888", fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sales.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: "1rem", color: "#aaa", textAlign: "center" }}>No sales yet. Add one above!</td></tr>
            ) : (
              sales.map((s, i) => (
                <tr key={s.id} style={{ background: i % 2 === 0 ? "white" : "#fafafa" }}>
                  <td style={{ padding: "10px 14px" }}>{s.id}</td>
                  <td style={{ padding: "10px 14px" }}>{s.product}</td>
                  <td style={{ padding: "10px 14px" }}>₱ {Number(s.amount).toLocaleString()}</td>
                  <td style={{ padding: "10px 14px" }}>{s.date}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <button
                      onClick={() => handleDelete(s.id)}
                      style={{ padding: "4px 10px", background: "#fee", color: "#c00", border: "1px solid #fcc", borderRadius: 5, cursor: "pointer", fontSize: 12 }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}