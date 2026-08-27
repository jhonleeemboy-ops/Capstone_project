import { useState, useEffect, useMemo } from "react";
import axios from "axios";

const STATUS_ORDER = ["OK", "Low Stock", "Out of Stock", "Expired"];

const STATUS_STYLES = {
  OK: { bg: "#EAF3DE", color: "#3B6D11" },
  "Low Stock": { bg: "#FAEEDA", color: "#854F0B" },
  "Out of Stock": { bg: "#fee", color: "#c00" },
  Expired: { bg: "#eee", color: "#666" },
};

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [product, setProduct] = useState("");
  const [stock, setStock] = useState("");
  const [price, setPrice] = useState("");
  const [reorderLevel, setReorderLevel] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = () => {
    setLoading(true);
    setError(null);
    axios
      .get("http://127.0.0.1:5000/inventory")
      .then((res) => setItems(res.data))
      .catch((err) => setError(err.message || "Failed to load inventory"))
      .finally(() => setLoading(false));
  };

  const handleAdd = () => {
    if (!product || !stock || !price || !reorderLevel) return;
    axios
      .post("http://127.0.0.1:5000/inventory", {
        product,
        stock,
        price,
        reorder_level: reorderLevel,
        expiry_date: expiryDate,
      })
      .then((res) => {
        setItems([...items, res.data.item]);
        setProduct("");
        setStock("");
        setPrice("");
        setReorderLevel("");
        setExpiryDate("");
        setShowAddForm(false);
      });
  };

  const handleDelete = (id) => {
    axios
      .delete(`http://127.0.0.1:5000/inventory/${id}`)
      .then(() => setItems(items.filter((i) => i.id !== id)));
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    Promise.all(
      selectedIds.map((id) => axios.delete(`http://127.0.0.1:5000/inventory/${id}`))
    ).then(() => {
      setItems(items.filter((i) => !selectedIds.includes(i.id)));
      setSelectedIds([]);
    });
  };

  const getStatus = (item) => {
    if (item.expiry_date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const exp = new Date(item.expiry_date);
      if (exp < today) return "Expired";
    }
    if (Number(item.stock) === 0) return "Out of Stock";
    if (Number(item.stock) <= Number(item.reorder_level)) return "Low Stock";
    return "OK";
  };

  const itemsWithStatus = useMemo(
    () => items.map((i) => ({ ...i, _status: getStatus(i) })),
    [items]
  );

  const counts = useMemo(() => {
    const c = { All: itemsWithStatus.length };
    STATUS_ORDER.forEach((s) => (c[s] = 0));
    itemsWithStatus.forEach((i) => {
      if (c[i._status] !== undefined) c[i._status] += 1;
    });
    return c;
  }, [itemsWithStatus]);

  const filteredItems = useMemo(() => {
    if (statusFilter === "All") return itemsWithStatus;
    return itemsWithStatus.filter((i) => i._status === statusFilter);
  }, [itemsWithStatus, statusFilter]);

  const lowStockCount = counts["Low Stock"] || 0;

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map((i) => i.id));
    }
  };

  // ---- inline style helpers ----
  const pillStyle = (active) => ({
    border: "1px solid #e5e7eb",
    background: active ? "#0f1b3d" : "#f9fafb",
    color: active ? "#fff" : "#374151",
    borderRadius: 999,
    padding: "9px 16px",
    fontSize: 13.5,
    fontWeight: 600,
    cursor: "pointer",
  });

  const inputStyle = { padding: "8px 12px", borderRadius: 6, border: "1px solid #ddd" };

  return (
    <div style={{ maxWidth: 900 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ fontSize: 22, marginBottom: 4 }}>Inventory Management</h1>
          <p style={{ fontSize: 13, color: "#888", margin: 0 }}>
            Track and manage your stock levels
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              style={{
                padding: "8px 16px",
                background: "#ef4444",
                color: "white",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              Delete {selectedIds.length} selected
            </button>
          )}
          <button
            onClick={() => setShowAddForm((v) => !v)}
            style={{
              padding: "8px 16px",
              background: "#0e3a5f",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            {showAddForm ? "Cancel" : "+ Add Product"}
          </button>
        </div>
      </div>

      {/* Add Item Form */}
      {showAddForm && (
        <div style={{ background: "#f5f5f5", padding: "1rem", borderRadius: 10, marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: 15, marginBottom: "1rem" }}>Add Inventory Item</h2>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              placeholder="Product name"
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              style={{ ...inputStyle, flex: 1, minWidth: 140 }}
            />
            <input
              placeholder="Stock qty"
              type="number"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              style={{ ...inputStyle, width: 100 }}
            />
            <input
              placeholder="Price (₱)"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              style={{ ...inputStyle, width: 110 }}
            />
            <input
              placeholder="Reorder level"
              type="number"
              value={reorderLevel}
              onChange={(e) => setReorderLevel(e.target.value)}
              style={{ ...inputStyle, width: 120 }}
            />
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              style={inputStyle}
            />
            <button
              onClick={handleAdd}
              style={{
                padding: "8px 16px",
                background: "#378ADD",
                color: "white",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              Add Item
            </button>
          </div>
          <p style={{ fontSize: 12, color: "#aaa", marginTop: 6 }}>
            Price is required so POS can calculate totals correctly. Reorder level = minimum
            stock before alert triggers. Expiry date is optional.
          </p>
        </div>
      )}

      {/* Filter pills */}
      <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 10, padding: "1rem", marginBottom: "1.5rem" }}>
        <span style={{ display: "block", fontSize: 13, color: "#666", marginBottom: 10 }}>
          Filter by Status:
        </span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button style={pillStyle(statusFilter === "All")} onClick={() => setStatusFilter("All")}>
            All Items ({counts.All || 0})
          </button>
          {STATUS_ORDER.map((status) => (
            <button
              key={status}
              style={pillStyle(statusFilter === status)}
              onClick={() => setStatusFilter(status)}
            >
              {status} ({counts[status] || 0})
            </button>
          ))}
        </div>
      </div>

      {/* Alert banner */}
      {lowStockCount > 0 && (
        <div
          style={{
            background: "#FAEEDA",
            color: "#854F0B",
            padding: "10px 14px",
            borderRadius: 8,
            marginBottom: "1.5rem",
            fontSize: 14,
          }}
        >
          {lowStockCount} item{lowStockCount > 1 ? "s are" : " is"} low on stock — consider
          reordering!
        </div>
      )}

      {/* Inventory Table */}
      <div style={{ border: "1px solid #eee", borderRadius: 10, overflow: "hidden" }}>
        {loading && (
          <div style={{ padding: "1.5rem", textAlign: "center", color: "#aaa" }}>
            Loading inventory…
          </div>
        )}
        {!loading && error && (
          <div style={{ padding: "1.5rem", textAlign: "center", color: "#c00" }}>
            Couldn't load inventory: {error}
            <div>
              <button
                onClick={fetchItems}
                style={{
                  marginTop: 8,
                  padding: "6px 14px",
                  border: "1px solid #ddd",
                  borderRadius: 6,
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                Retry
              </button>
            </div>
          </div>
        )}
        {!loading && !error && (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead style={{ background: "#f9f9f9" }}>
              <tr>
                <th style={{ padding: "10px 14px", borderBottom: "1px solid #eee", width: 36 }}>
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.length === filteredItems.length && filteredItems.length > 0
                    }
                    onChange={toggleSelectAll}
                  />
                </th>
                {["Product", "Stock", "Price (₱)", "Reorder Level", "Expiry Date", "Status", "Action"].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "10px 14px",
                        borderBottom: "1px solid #eee",
                        color: "#888",
                        fontWeight: 500,
                      }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: "1rem", color: "#aaa", textAlign: "center" }}>
                    {items.length === 0 ? "No items yet. Add one above!" : "No items match this filter."}
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, i) => {
                  const priceMissing = !item.price || Number(item.price) === 0;
                  const statusStyle = STATUS_STYLES[item._status];
                  return (
                    <tr key={item.id} style={{ background: i % 2 === 0 ? "white" : "#fafafa" }}>
                      <td style={{ padding: "10px 14px" }}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.id)}
                          onChange={() => toggleSelect(item.id)}
                        />
                      </td>
                      <td style={{ padding: "10px 14px" }}>{item.product}</td>
                      <td style={{ padding: "10px 14px" }}>{item.stock}</td>
                      <td style={{ padding: "10px 14px", color: priceMissing ? "#c00" : "inherit" }}>
                        {priceMissing ? "Not set" : `₱${Number(item.price).toLocaleString()}`}
                      </td>
                      <td style={{ padding: "10px 14px" }}>{item.reorder_level}</td>
                      <td style={{ padding: "10px 14px" }}>{item.expiry_date || "—"}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <span
                          style={{
                            background: statusStyle.bg,
                            color: statusStyle.color,
                            padding: "3px 10px",
                            borderRadius: 99,
                            fontSize: 12,
                          }}
                        >
                          {item._status}
                        </span>
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <button
                          onClick={() => handleDelete(item.id)}
                          style={{
                            padding: "4px 10px",
                            background: "#fee",
                            color: "#c00",
                            border: "1px solid #fcc",
                            borderRadius: 5,
                            cursor: "pointer",
                            fontSize: 12,
                          }}
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
        )}
      </div>
    </div>
  );
}
