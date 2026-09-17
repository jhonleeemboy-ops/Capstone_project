import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { API_URL } from "../config";

const STATUS_ORDER = ["OK", "Low Stock", "Out of Stock", "Expired"];

const STATUS_STYLES = {
  OK: { bg: "rgba(34, 197, 94, 0.15)", color: "#16a34a", border: "rgba(34, 197, 94, 0.3)" },
  "Low Stock": { bg: "rgba(249, 115, 22, 0.15)", color: "#ea580c", border: "rgba(249, 115, 22, 0.3)" },
  "Out of Stock": { bg: "rgba(239, 68, 68, 0.15)", color: "#ef4444", border: "rgba(239, 68, 68, 0.3)" },
  Expired: { bg: "rgba(100, 116, 139, 0.15)", color: "#64748b", border: "rgba(100, 116, 139, 0.3)" },
};

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [product, setProduct] = useState("");
  const [stock, setStock] = useState("");
  const [price, setPrice] = useState("");
  const [profit, setProfit] = useState("");
  const [reorderLevel, setReorderLevel] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedIds, setSelectedIds] = useState([]);

  // Stock adjustment modal state
  const [modalItem, setModalItem] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [adjAmount, setAdjAmount] = useState("");

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = () => {
    setLoading(true);
    setError(null);
    axios
      .get(`${API_URL}/inventory`)
      .then((res) => setItems(res.data))
      .catch((err) => setError(err.message || "Failed to load inventory"))
      .finally(() => setLoading(false));
  };

  const handleAdd = () => {
    if (!product || !stock || !price || !reorderLevel) return;

    if (profit !== "" && Number(profit) > Number(price)) {
      alert("Profit cannot exceed the selling price!");
      return;
    }

    axios
      .post(`${API_URL}/inventory`, {
        product,
        stock,
        price,
        profit: profit !== "" ? profit : 0,
        reorder_level: reorderLevel,
        expiry_date: expiryDate,
      })
      .then((res) => {
        setItems([...items, res.data.item]);
        setProduct("");
        setStock("");
        setPrice("");
        setProfit("");
        setReorderLevel("");
        setExpiryDate("");
        setShowAddForm(false);
      });
  };

  const handleDelete = (id) => {
    axios
      .delete(`${API_URL}/inventory/${id}`)
      .then(() => setItems(items.filter((i) => i.id !== id)));
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    Promise.all(
      selectedIds.map((id) => axios.delete(`${API_URL}/inventory/${id}`))
    ).then(() => {
      setItems(items.filter((i) => !selectedIds.includes(i.id)));
      setSelectedIds([]);
    });
  };

  const handleStockAdjustment = () => {
    if (!modalItem || !adjAmount || Number(adjAmount) <= 0) return;

    const qty = Number(adjAmount);
    let newStock = modalType === "add" ? Number(modalItem.stock) + qty : Number(modalItem.stock) - qty;

    if (newStock < 0) {
      alert("Stock cannot go below 0!");
      return;
    }

    axios
      .put(`${API_URL}/inventory/${modalItem.id}`, {
        ...modalItem,
        stock: newStock,
      })
      .then(() => {
        setItems(
          items.map((i) => (i.id === modalItem.id ? { ...i, stock: newStock } : i))
        );
        setModalItem(null);
        setModalType(null);
        setAdjAmount("");
      })
      .catch(() => {
        setItems(
          items.map((i) => (i.id === modalItem.id ? { ...i, stock: newStock } : i))
        );
        setModalItem(null);
        setModalType(null);
        setAdjAmount("");
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

  const lightGlassPanelStyle = {
    background: "linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(241, 245, 249, 0.95) 100%)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 255, 255, 0.9)",
    borderRadius: 24,
    padding: "1.5rem",
    boxShadow: "0 12px 40px 0 rgba(31, 38, 135, 0.08), 0 2px 4px 0 rgba(255, 255, 255, 0.5) inset",
    marginBottom: "1.5rem",
  };

  const pillStyle = (active) => ({
    border: active ? "1px solid rgba(14, 116, 144, 0.4)" : "1px solid rgba(203, 213, 225, 0.8)",
    background: active ? "#0f172a" : "rgba(255, 255, 255, 0.7)",
    color: active ? "#fff" : "#334155",
    borderRadius: 999,
    padding: "8px 16px",
    fontSize: 13.5,
    fontWeight: active ? 700 : 600,
    cursor: "pointer",
    boxShadow: active ? "0 4px 12px rgba(15, 23, 42, 0.2)" : "0 2px 6px rgba(0,0,0,0.02)",
    transition: "all 0.2s",
  });

  const inputStyle = {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid rgba(203, 213, 225, 0.8)",
    background: "rgba(255, 255, 255, 0.8)",
    color: "#0f172a",
    fontSize: 14,
    outline: "none",
    boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)",
  };

  return (
    <div style={{
      width: "100%",
      color: "#1e293b",
      fontFamily: "inherit",
      padding: "1.5rem",
      background: "#e4e7eb",
      minHeight: "100vh",
      boxSizing: "border-box",
    }}>
      {/* Header matching the layout reference style */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "2rem",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: "#0f172a",
              marginBottom: 4,
              letterSpacing: "-0.5px",
            }}
          >
            Inventory Management
          </h1>
          <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>
            Track and manage your stock levels
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              style={{
                padding: "10px 16px",
                background: "#ef4444",
                color: "white",
                border: "none",
                borderRadius: 12,
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 13.5,
                boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
                transition: "all 0.2s",
              }}
            >
              Delete {selectedIds.length} selected
            </button>
          )}
          <button
            onClick={() => setShowAddForm((v) => !v)}
            style={{
              padding: "10px 18px",
              background: "#0f172a",
              color: "white",
              border: "none",
              borderRadius: 12,
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 13.5,
              boxShadow: "0 4px 16px rgba(15, 23, 42, 0.25)",
              transition: "all 0.2s",
            }}
          >
            {showAddForm ? "Cancel" : "+ Add Product"}
          </button>
        </div>
      </div>

      {/* Add Item Form Container */}
      {showAddForm && (
        <div style={{ ...lightGlassPanelStyle, border: "1px solid rgba(15, 23, 42, 0.15)" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: "1rem" }}>Add Inventory Item</h2>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input
              placeholder="Product name"
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              style={{ ...inputStyle, flex: 1, minWidth: 160 }}
            />
            <input
              placeholder="Stock qty"
              type="number"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              style={{ ...inputStyle, width: 110 }}
            />
            <input
              placeholder="Price (₱)"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              style={{ ...inputStyle, width: 120 }}
            />
            <input
              placeholder="Profit (₱)"
              type="number"
              min="0"
              step="0.01"
              value={profit}
              onChange={(e) => setProfit(e.target.value)}
              style={{ ...inputStyle, width: 110 }}
            />
            <input
              placeholder="Min Threshold"
              type="number"
              value={reorderLevel}
              onChange={(e) => setReorderLevel(e.target.value)}
              style={{ ...inputStyle, width: 130 }}
            />
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              style={{ ...inputStyle, width: 150 }}
            />
            <button
              onClick={handleAdd}
              style={{
                padding: "10px 20px",
                background: "#0284c7",
                color: "white",
                border: "none",
                borderRadius: 12,
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 14,
                boxShadow: "0 4px 14px rgba(2, 132, 199, 0.35)",
              }}
            >
              Add Item
            </button>
          </div>
          <p style={{ fontSize: 12, color: "#64748b", marginTop: 10 }}>
            Price is required so POS can calculate totals correctly. Profit cannot exceed the selling price. Min Threshold = minimum stock before alert triggers.
          </p>
        </div>
      )}

      {/* Filter pills container */}
      <div style={lightGlassPanelStyle}>
        <span style={{ display: "block", fontSize: 13, color: "#64748b", marginBottom: 10, fontWeight: 600 }}>
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
            background: "rgba(249, 115, 22, 0.12)",
            border: "1px solid rgba(249, 115, 22, 0.3)",
            color: "#c2410c",
            padding: "12px 16px",
            borderRadius: 14,
            marginBottom: "1.5rem",
            fontSize: 14,
            fontWeight: 600,
            backdropFilter: "blur(10px)",
          }}
        >
          ⚠️ {lowStockCount} item{lowStockCount > 1 ? "s are" : " is"} low on stock — consider reordering!
        </div>
      )}

      {/* Inventory Table Container */}
      <div style={{ ...lightGlassPanelStyle, overflow: "hidden", padding: 0 }}>
        {loading && (
          <div style={{ padding: "2.5rem", textAlign: "center", color: "#64748b" }}>
            Loading inventory…
          </div>
        )}
        {!loading && error && (
          <div style={{ padding: "2.5rem", textAlign: "center", color: "#ef4444" }}>
            Couldn't load inventory: {error}
            <div>
              <button
                onClick={fetchItems}
                style={{
                  marginTop: 10,
                  padding: "8px 16px",
                  border: "1px solid rgba(203, 213, 225, 0.8)",
                  borderRadius: 10,
                  background: "#fff",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Retry
              </button>
            </div>
          </div>
        )}
        {!loading && !error && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, textAlign: "left" }}>
              <thead>
                <tr style={{ background: "rgba(255, 255, 255, 0.6)", borderBottom: "1px solid rgba(203, 213, 225, 0.8)" }}>
                  <th style={{ padding: "14px 16px", width: 40 }}>
                    <input
                      type="checkbox"
                      checked={
                        selectedIds.length === filteredItems.length && filteredItems.length > 0
                      }
                      onChange={toggleSelectAll}
                    />
                  </th>
                  {["Product", "Stock", "Min Threshold", "Expiry Date", "Status", "Action"].map(
                    (h) => (
                      <th
                        key={h}
                        style={{
                          padding: "14px 16px",
                          color: "#475569",
                          fontWeight: 700,
                          fontSize: 13,
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
                    <td colSpan={7} style={{ padding: "2.5rem", color: "#64748b", textAlign: "center" }}>
                      {items.length === 0 ? "No items yet. Add one above!" : "No items match this filter."}
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item, i) => {
                    const statusStyle = STATUS_STYLES[item._status];
                    return (
                      <tr
                        key={item.id}
                        style={{
                          background: i % 2 === 0 ? "rgba(255, 255, 255, 0.4)" : "rgba(255, 255, 255, 0.1)",
                          borderBottom: "1px solid rgba(203, 213, 225, 0.5)",
                          transition: "background 0.2s",
                        }}
                      >
                        <td style={{ padding: "14px 16px" }}>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(item.id)}
                            onChange={() => toggleSelect(item.id)}
                          />
                        </td>
                        <td style={{ padding: "14px 16px", fontWeight: 700, color: "#0f172a" }}>{item.product}</td>
                        <td style={{ padding: "14px 16px", fontWeight: 600 }}>{item.stock}</td>
                        <td style={{ padding: "14px 16px", color: "#64748b", fontWeight: 500 }}>{item.reorder_level}</td>
                        <td style={{ padding: "14px 16px", color: "#64748b", fontWeight: 500 }}>{item.expiry_date || "—"}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <span
                            style={{
                              background: statusStyle.bg,
                              color: statusStyle.color,
                              border: `1px solid ${statusStyle.border}`,
                              padding: "4px 12px",
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 800,
                              display: "inline-block",
                            }}
                          >
                            {item._status}
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              onClick={() => { setModalItem(item); setModalType("add"); }}
                              style={{
                                padding: "6px 12px",
                                background: "rgba(34, 197, 94, 0.1)",
                                color: "#16a34a",
                                border: "1px solid rgba(34, 197, 94, 0.3)",
                                borderRadius: 8,
                                cursor: "pointer",
                                fontSize: 12,
                                fontWeight: 700,
                              }}
                              title="Add stock"
                            >
                              +
                            </button>
                            <button
                              onClick={() => { setModalItem(item); setModalType("reduce"); }}
                              style={{
                                padding: "6px 12px",
                                background: "rgba(249, 115, 22, 0.1)",
                                color: "#ea580c",
                                border: "1px solid rgba(249, 115, 22, 0.3)",
                                borderRadius: 8,
                                cursor: "pointer",
                                fontSize: 12,
                                fontWeight: 700,
                              }}
                              title="Reduce stock"
                            >
                              -
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              style={{
                                padding: "6px 12px",
                                background: "rgba(239, 68, 68, 0.1)",
                                color: "#ef4444",
                                border: "1px solid rgba(239, 68, 68, 0.3)",
                                borderRadius: 8,
                                cursor: "pointer",
                                fontSize: 12,
                                fontWeight: 600,
                              }}
                              title="Delete item"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal Popup */}
      {modalItem && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.4)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}>
          <div style={{
            background: "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(241, 245, 249, 0.98) 100%)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.9)",
            padding: "1.75rem",
            borderRadius: 24,
            width: 340,
            boxShadow: "0 20px 50px rgba(31, 38, 135, 0.25)",
          }}>
            <h3 style={{ marginTop: 0, marginBottom: 10, fontSize: 18, fontWeight: 700, color: "#0f172a" }}>
              {modalType === "add" ? "Add Stock" : "Reduce Stock"} — {modalItem.product}
            </h3>
            <p style={{ fontSize: 13, color: "#64748b", marginBottom: 14 }}>
              Current stock: <strong>{modalItem.stock}</strong>. Enter quantity to {modalType}:
            </p>
            <input
              type="number"
              min="1"
              placeholder="Quantity"
              value={adjAmount}
              onChange={(e) => setAdjAmount(e.target.value)}
              style={{ ...inputStyle, width: "100%", marginBottom: 16, boxSizing: "border-box" }}
              autoFocus
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                onClick={() => { setModalItem(null); setModalType(null); setAdjAmount(""); }}
                style={{
                  padding: "10px 16px",
                  background: "rgba(255, 255, 255, 0.7)",
                  border: "1px solid rgba(203, 213, 225, 0.8)",
                  borderRadius: 12,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#334155",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleStockAdjustment}
                style={{
                  padding: "10px 18px",
                  background: modalType === "add" ? "#0284c7" : "#ef4444",
                  color: "#fff",
                  border: "none",
                  borderRadius: 12,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  boxShadow: modalType === "add" ? "0 4px 14px rgba(2, 132, 199, 0.35)" : "0 4px 14px rgba(239, 68, 68, 0.35)",
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}