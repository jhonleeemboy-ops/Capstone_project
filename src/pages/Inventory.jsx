import { useState, useEffect } from "react";
import axios from "axios";

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [product, setProduct] = useState("");
  const [stock, setStock] = useState("");
  const [reorderLevel, setReorderLevel] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  useEffect(() => {
    axios.get("http://127.0.0.1:5000/inventory")
      .then(res => setItems(res.data));
  }, []);

  const handleAdd = () => {
    if (!product || !stock || !reorderLevel) return;
    axios.post("http://127.0.0.1:5000/inventory", {
      product, stock, reorder_level: reorderLevel, expiry_date: expiryDate
    }).then(res => {
      setItems([...items, res.data.item]);
      setProduct(""); setStock(""); setReorderLevel(""); setExpiryDate("");
    });
  };

  const handleDelete = (id) => {
    axios.delete(`http://127.0.0.1:5000/inventory/${id}`)
      .then(() => setItems(items.filter(i => i.id !== id)));
  };

  const getStatus = (item) => {
    if (item.stock === 0) return { label: "Out of stock", color: "#c00", bg: "#fee" };
    if (item.stock <= item.reorder_level) return { label: "Low stock", color: "#854F0B", bg: "#FAEEDA" };
    return { label: "OK", color: "#3B6D11", bg: "#EAF3DE" };
  };

  const lowStockCount = items.filter(i => i.stock <= i.reorder_level).length;

  return (
    <div style={{ maxWidth: 800 }}>
      <h1 style={{ fontSize: 22, marginBottom: 6 }}>Inventory</h1>

      {/* Alert banner */}
      {lowStockCount > 0 && (
        <div style={{ background: "#FAEEDA", color: "#854F0B", padding: "10px 14px", borderRadius: 8, marginBottom: "1.5rem", fontSize: 14 }}>
          {lowStockCount} item{lowStockCount > 1 ? "s are" : " is"} low on stock — consider reordering!
        </div>
      )}

      {/* Add Item Form */}
      <div style={{ background: "#f5f5f5", padding: "1rem", borderRadius: 10, marginBottom: "2rem" }}>
        <h2 style={{ fontSize: 15, marginBottom: "1rem" }}>Add Inventory Item</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            placeholder="Product name"
            value={product}
            onChange={e => setProduct(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #ddd", flex: 1, minWidth: 140 }}
          />
          <input
            placeholder="Stock qty"
            type="number"
            value={stock}
            onChange={e => setStock(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #ddd", width: 100 }}
          />
          <input
            placeholder="Reorder level"
            type="number"
            value={reorderLevel}
            onChange={e => setReorderLevel(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #ddd", width: 120 }}
          />
          <input
            type="date"
            value={expiryDate}
            onChange={e => setExpiryDate(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #ddd" }}
          />
          <button
            onClick={handleAdd}
            style={{ padding: "8px 16px", background: "#378ADD", color: "white", border: "none", borderRadius: 6, cursor: "pointer" }}
          >
            Add Item
          </button>
        </div>
        <p style={{ fontSize: 12, color: "#aaa", marginTop: 6 }}>
          Reorder level = minimum stock before alert triggers. Expiry date is optional.
        </p>
      </div>

      {/* Inventory Table */}
      <div style={{ border: "1px solid #eee", borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead style={{ background: "#f9f9f9" }}>
            <tr>
              {["Product", "Stock", "Reorder Level", "Expiry Date", "Status", "Action"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "10px 14px", borderBottom: "1px solid #eee", color: "#888", fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: "1rem", color: "#aaa", textAlign: "center" }}>No items yet. Add one above!</td></tr>
            ) : (
              items.map((item, i) => {
                const status = getStatus(item);
                return (
                  <tr key={item.id} style={{ background: i % 2 === 0 ? "white" : "#fafafa" }}>
                    <td style={{ padding: "10px 14px" }}>{item.product}</td>
                    <td style={{ padding: "10px 14px" }}>{item.stock}</td>
                    <td style={{ padding: "10px 14px" }}>{item.reorder_level}</td>
                    <td style={{ padding: "10px 14px" }}>{item.expiry_date || "—"}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ background: status.bg, color: status.color, padding: "3px 10px", borderRadius: 99, fontSize: 12 }}>
                        {status.label}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <button
                        onClick={() => handleDelete(item.id)}
                        style={{ padding: "4px 10px", background: "#fee", color: "#c00", border: "1px solid #fcc", borderRadius: 5, cursor: "pointer", fontSize: 12 }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}