import { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../config";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faTimes,
  faMinus,
  faPlus,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";

export default function POS() {
  const [inventory, setInventory] = useState([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [cashReceived, setCashReceived] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = () => {
    setLoading(true);
    axios.get(`${API_URL}/inventory`)
      .then(res => setInventory(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const filteredInventory = inventory.filter(item =>
    item.product.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (item) => {
    if (item.stock <= 0) return;

    setCart(prev => {
      const existing = prev.find(c => c.inventory_id === item.id);
      if (existing) {
        if (existing.quantity >= item.stock) return prev;
        return prev.map(c =>
          c.inventory_id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, {
        inventory_id: item.id,
        product: item.product,
        price: Number(item.price),
        quantity: 1,
        stock: item.stock,
      }];
    });
  };

  const updateQuantity = (inventory_id, delta) => {
    setCart(prev =>
      prev
        .map(c => {
          if (c.inventory_id !== inventory_id) return c;
          const newQty = c.quantity + delta;
          if (newQty > c.stock) return c;
          return { ...c, quantity: newQty };
        })
        .filter(c => c.quantity > 0)
    );
  };

  const removeFromCart = (inventory_id) => {
    setCart(prev => prev.filter(c => c.inventory_id !== inventory_id));
  };

  const clearOrder = () => {
    setCart([]);
    setCashReceived("");
    setError("");
  };

  const total = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
  const change = cashReceived ? Number(cashReceived) - total : 0;

  const handleCompleteSale = () => {
    setError("");

    if (cart.length === 0) {
      setError("Cart is empty. Tap a product to add it.");
      return;
    }
    if (!cashReceived || Number(cashReceived) < total) {
      setError("Cash received must cover the total.");
      return;
    }

    setProcessing(true);

    const payload = {
      items: cart.map(c => ({ inventory_id: c.inventory_id, quantity: c.quantity })),
      cash_received: Number(cashReceived),
      date: new Date().toISOString().slice(0, 10),
    };

    axios.post(`${API_URL}/pos-checkout`, payload)
      .then(res => {
        setReceipt(res.data);
        clearOrder();
        loadInventory();
      })
      .catch(err => {
        setError(err.response?.data?.error || "Checkout failed. Please try again.");
      })
      .finally(() => setProcessing(false));
  };

  const lightGlassPanelStyle = {
    background: "linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(241, 245, 249, 0.95) 100%)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 255, 255, 0.9)",
    borderRadius: 24,
    padding: "1.5rem",
    boxShadow: "0 12px 40px 0 rgba(31, 38, 135, 0.08), 0 2px 4px 0 rgba(255, 255, 255, 0.5) inset",
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
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: "#0f172a",
            marginBottom: 4,
            letterSpacing: "-0.5px",
          }}
        >
          Point of Sale
        </h1>
        <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>
          Select products to build customer orders and checkout
        </p>
      </div>

      <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
        {/* LEFT: Product search + grid */}
        <div style={{ flex: 1, ...lightGlassPanelStyle }}>
          <div style={{ position: "relative", marginBottom: "1.5rem" }}>
            <FontAwesomeIcon
              icon={faSearch}
              style={{
                position: "absolute",
                left: 16,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#64748b",
                width: 14,
                height: 14,
              }}
            />
            <input
              type="text"
              placeholder="Search product..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px 12px 42px",
                borderRadius: 14,
                border: "1px solid rgba(203, 213, 225, 0.8)",
                background: "rgba(255, 255, 255, 0.8)",
                color: "#0f172a",
                fontSize: 14,
                boxSizing: "border-box",
                outline: "none",
                boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)",
              }}
            />
          </div>

          {loading ? (
            <p style={{ color: "#64748b", textAlign: "center", padding: "2rem" }}>Loading products...</p>
          ) : filteredInventory.length === 0 ? (
            <p style={{ color: "#64748b", textAlign: "center", padding: "2rem" }}>No products found.</p>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 16,
            }}>
              {filteredInventory.map(item => {
                const outOfStock = item.stock <= 0;
                const lowStock = !outOfStock && item.stock <= item.reorder_level;
                return (
                  <div
                    key={item.id}
                    onClick={() => !outOfStock && addToCart(item)}
                    style={{
                      background: "rgba(255, 255, 255, 0.75)",
                      border: "1px solid rgba(255, 255, 255, 0.9)",
                      borderRadius: 16,
                      padding: "1.25rem",
                      cursor: outOfStock ? "not-allowed" : "pointer",
                      opacity: outOfStock ? 0.4 : 1,
                      transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                      userSelect: "none",
                      boxShadow: "0 4px 16px rgba(0, 0, 0, 0.04)",
                    }}
                    onMouseEnter={e => { if (!outOfStock) { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(14, 116, 144, 0.12)"; e.currentTarget.style.border = "1px solid rgba(14, 116, 144, 0.3)"; }}}
                    onMouseLeave={e => { if (!outOfStock) { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.04)"; e.currentTarget.style.border = "1px solid rgba(255, 255, 255, 0.9)"; }}}
                  >
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", margin: "0 0 6px" }}>
                      {item.product}
                    </p>
                    <p style={{ fontSize: 18, fontWeight: 700, color: "#0284c7", margin: "0 0 10px" }}>
                      ₱{Number(item.price).toFixed(0)}
                    </p>
                    <span style={{
                      display: "inline-block",
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "4px 10px",
                      borderRadius: 6,
                      background: outOfStock ? "rgba(239, 68, 68, 0.1)" : lowStock ? "rgba(249, 115, 22, 0.1)" : "rgba(34, 197, 94, 0.1)",
                      color: outOfStock ? "#ef4444" : lowStock ? "#ea580c" : "#16a34a",
                      border: `1px solid ${outOfStock ? "rgba(239, 68, 68, 0.25)" : lowStock ? "rgba(249, 115, 22, 0.25)" : "rgba(34, 197, 94, 0.25)"}`,
                    }}>
                      {outOfStock ? "Out of stock" : `${item.stock} in stock`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT: Current order panel */}
        <div style={{ width: 380, position: "sticky", top: 20, ...lightGlassPanelStyle }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: "1rem" }}>
            Current Order
          </h2>

          {cart.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem 0", color: "#64748b" }}>
              <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 500 }}>No items in cart</p>
              <p style={{ margin: 0, fontSize: 13, opacity: 0.8 }}>Tap a product to add</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: "1rem", maxHeight: 320, overflowY: "auto" }}>
              {cart.map(c => (
                <div key={c.inventory_id} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: 13,
                  padding: "10px 12px",
                  borderRadius: 12,
                  background: "rgba(255, 255, 255, 0.7)",
                  border: "1px solid rgba(255, 255, 255, 0.9)",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)",
                }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 600, color: "#0f172a" }}>{c.product}</p>
                    <p style={{ margin: 0, color: "#64748b", fontSize: 11 }}>₱{c.price.toFixed(2)} each</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button onClick={() => updateQuantity(c.inventory_id, -1)} style={qtyBtnStyle}>
                      <FontAwesomeIcon icon={faMinus} style={{ fontSize: 10, color: "#0f172a" }} />
                    </button>
                    <span style={{ minWidth: 20, textAlign: "center", fontWeight: 600, color: "#0f172a" }}>{c.quantity}</span>
                    <button onClick={() => updateQuantity(c.inventory_id, 1)} style={qtyBtnStyle}>
                      <FontAwesomeIcon icon={faPlus} style={{ fontSize: 10, color: "#0f172a" }} />
                    </button>
                  </div>
                  <p style={{ margin: "0 0 0 12px", fontWeight: 700, minWidth: 55, textAlign: "right", color: "#16a34a" }}>
                    ₱{(c.price * c.quantity).toFixed(0)}
                  </p>
                  <button
                    onClick={() => removeFromCart(c.inventory_id)}
                    style={{ marginLeft: 8, border: "none", background: "none", color: "#ef4444", cursor: "pointer", fontSize: 13, padding: 4 }}
                  >
                    <FontAwesomeIcon icon={faTimes} style={{ width: 12, height: 12, color: "#ef4444" }} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={{ borderTop: "1px solid rgba(203, 213, 225, 0.8)", paddingTop: "1rem", marginTop: "0.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 700, marginBottom: "1rem", color: "#0f172a" }}>
              <span>Total</span>
              <span>₱{total.toFixed(2)}</span>
            </div>

            <label style={{ fontSize: 13, color: "#64748b", display: "block", marginBottom: 6, fontWeight: 600 }}>
              Cash Received
            </label>
            <input
              type="number"
              placeholder="0.00"
              value={cashReceived}
              onChange={e => setCashReceived(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid rgba(203, 213, 225, 0.8)",
                background: "rgba(255, 255, 255, 0.8)",
                color: "#0f172a",
                fontSize: 14,
                marginBottom: "0.75rem",
                boxSizing: "border-box",
                outline: "none",
                boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)",
              }}
            />

            {cashReceived && Number(cashReceived) >= total && total > 0 && (
              <p style={{ fontSize: 13, color: "#16a34a", margin: "0 0 0.75rem", fontWeight: 600 }}>
                Change: ₱{change.toFixed(2)}
              </p>
            )}

            {error && (
              <p style={{ fontSize: 13, color: "#ef4444", margin: "0 0 0.75rem" }}>{error}</p>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: "0.5rem" }}>
              <button
                onClick={clearOrder}
                disabled={processing}
                style={{
                  flex: 1,
                  padding: "11px 0",
                  borderRadius: 12,
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  background: "rgba(239, 68, 68, 0.08)",
                  color: "#ef4444",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteSale}
                disabled={processing || cart.length === 0}
                style={{
                  flex: 1,
                  padding: "11px 0",
                  borderRadius: 12,
                  border: "none",
                  background: processing || cart.length === 0 ? "#cbd5e1" : "#0f172a",
                  color: "#fff",
                  fontWeight: 600,
                  cursor: processing || cart.length === 0 ? "not-allowed" : "pointer",
                  boxShadow: processing || cart.length === 0 ? "none" : "0 4px 16px rgba(15, 23, 42, 0.25)",
                  transition: "all 0.2s",
                }}
              >
                {processing ? "Processing..." : "Complete Sale"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Receipt confirmation modal */}
      {receipt && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)",
          backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50,
        }}>
          <div style={{
            background: "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(241, 245, 249, 0.98) 100%)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.9)",
            borderRadius: 24,
            padding: "1.75rem",
            width: 340,
            boxShadow: "0 20px 50px rgba(31, 38, 135, 0.25)",
          }}>
            <h3 style={{ marginTop: 0, fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center", gap: 8, color: "#0f172a" }}>
              Sale Complete
              <FontAwesomeIcon icon={faCheckCircle} style={{ color: "#16a34a", width: 16, height: 16 }} />
            </h3>
            {receipt.items.map(it => (
              <div key={it.inventory_id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6, color: "#64748b" }}>
                <span>{it.product} × {it.quantity}</span>
                <span>₱{it.amount.toFixed(2)}</span>
              </div>
            ))}
            <div style={{ borderTop: "1px solid rgba(203, 213, 225, 0.8)", marginTop: 12, paddingTop: 12, fontSize: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
                <span>Total</span><span>₱{receipt.total_amount.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b", marginBottom: 4 }}>
                <span>Cash</span><span>₱{receipt.cash_received.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#16a34a", fontWeight: 600 }}>
                <span>Change</span><span>₱{receipt.change_amount.toFixed(2)}</span>
              </div>
            </div>
            <button
              onClick={() => setReceipt(null)}
              style={{
                marginTop: 20,
                width: "100%",
                padding: "12px 0",
                borderRadius: 12,
                border: "none",
                background: "#0f172a",
                color: "#fff",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(15, 23, 42, 0.25)",
              }}
            >
              New Sale
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const qtyBtnStyle = {
  width: 26,
  height: 26,
  borderRadius: 8,
  border: "1px solid rgba(203, 213, 225, 0.9)",
  background: "rgba(255, 255, 255, 0.9)",
  cursor: "pointer",
  fontSize: 12,
  lineHeight: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#0f172a",
  boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
};