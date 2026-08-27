import { useState, useEffect } from "react";
import axios from "axios";
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
  const [cart, setCart] = useState([]); // [{ inventory_id, product, price, quantity, stock }]
  const [cashReceived, setCashReceived] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    loadInventory();1
  }, []);

  const loadInventory = () => {
    setLoading(true);
    axios.get("http://127.0.0.1:5000/inventory")
      .then(res => setInventory(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const filteredInventory = inventory.filter(item =>
    item.product.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (item) => {
    if (item.stock <= 0) return; // can't add out-of-stock items

    setCart(prev => {
      const existing = prev.find(c => c.inventory_id === item.id);
      if (existing) {
        // don't let cart quantity exceed available stock
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
          if (newQty > c.stock) return c; // cap at available stock
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

    axios.post("http://127.0.0.1:5000/pos-checkout", payload)
      .then(res => {
        setReceipt(res.data);
        clearOrder();
        loadInventory(); // refresh stock numbers after sale
      })
      .catch(err => {
        setError(err.response?.data?.error || "Checkout failed. Please try again.");
      })
      .finally(() => setProcessing(false));
  };

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: "#0f172a", marginBottom: "1.5rem" }}>
        Point of Sale
      </h1>

      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
        {/* LEFT: Product search + grid */}
        <div style={{
          flex: 1,
          background: "#fff",
          borderRadius: 16,
          padding: "1.5rem",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}>
          <div style={{ position: "relative", marginBottom: "1.5rem" }}>
            <FontAwesomeIcon
              icon={faSearch}
              style={{
                position: "absolute",
                left: 16,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94a3b8",
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
                padding: "12px 16px 12px 40px",
                borderRadius: 10,
                border: "1px solid #e2e8f0",
                background: "#f8fafc",
                fontSize: 14,
                boxSizing: "border-box",
              }}
            />
          </div>

          {loading ? (
            <p style={{ color: "#94a3b8", textAlign: "center", padding: "2rem" }}>Loading products...</p>
          ) : filteredInventory.length === 0 ? (
            <p style={{ color: "#94a3b8", textAlign: "center", padding: "2rem" }}>No products found.</p>
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
                    onClick={() => addToCart(item)}
                    style={{
                      background: "#f8fafc",
                      borderRadius: 12,
                      padding: "1rem",
                      cursor: outOfStock ? "not-allowed" : "pointer",
                      opacity: outOfStock ? 0.5 : 1,
                      transition: "transform 0.1s",
                      userSelect: "none",
                    }}
                    onMouseDown={e => { if (!outOfStock) e.currentTarget.style.transform = "scale(0.97)"; }}
                    onMouseUp={e => { e.currentTarget.style.transform = "scale(1)"; }}
                  >
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", margin: "0 0 6px" }}>
                      {item.product}
                    </p>
                    <p style={{ fontSize: 18, fontWeight: 700, color: "#0369a1", margin: "0 0 10px" }}>
                      ₱{Number(item.price).toFixed(0)}
                    </p>
                    <span style={{
                      display: "inline-block",
                      fontSize: 12,
                      fontWeight: 600,
                      padding: "3px 10px",
                      borderRadius: 99,
                      background: outOfStock ? "#fee2e2" : lowStock ? "#fee2e2" : "#dcfce7",
                      color: outOfStock ? "#ef4444" : lowStock ? "#ef4444" : "#16a34a",
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
        <div style={{
          width: 340,
          background: "#fff",
          borderRadius: 16,
          padding: "1.5rem",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          position: "sticky",
          top: 20,
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: "1rem" }}>
            Current Order
          </h2>

          {cart.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2.5rem 0", color: "#94a3b8" }}>
              <p style={{ margin: "0 0 4px", fontSize: 14 }}>No items in cart</p>
              <p style={{ margin: 0, fontSize: 13 }}>Tap a product to add</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: "1rem", maxHeight: 320, overflowY: "auto" }}>
              {cart.map(c => (
                <div key={c.inventory_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 600, color: "#0f172a" }}>{c.product}</p>
                    <p style={{ margin: 0, color: "#64748b" }}>₱{c.price.toFixed(2)} each</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button onClick={() => updateQuantity(c.inventory_id, -1)} style={qtyBtnStyle}>
                      <FontAwesomeIcon icon={faMinus} style={{ fontSize: 10, width: 10, height: 10, color: "#0f172a" }} />
                    </button>
                    <span style={{ minWidth: 18, textAlign: "center" }}>{c.quantity}</span>
                    <button onClick={() => updateQuantity(c.inventory_id, 1)} style={qtyBtnStyle}>
                      <FontAwesomeIcon icon={faPlus} style={{ fontSize: 10, width: 10, height: 10, color: "#0f172a" }} />
                    </button>
                  </div>
                  <p style={{ margin: "0 0 0 10px", fontWeight: 700, minWidth: 55, textAlign: "right" }}>
                    ₱{(c.price * c.quantity).toFixed(0)}
                  </p>
                  <button
                    onClick={() => removeFromCart(c.inventory_id)}
                    style={{ marginLeft: 6, border: "none", background: "none", color: "#ef4444", cursor: "pointer", fontSize: 13 }}
                  >
                    <FontAwesomeIcon icon={faTimes} style={{ width: 12, height: 12, color: "#ef4444" }} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "1rem", marginTop: "0.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 700, marginBottom: "1rem" }}>
              <span>Total</span>
              <span>₱{total.toFixed(2)}</span>
            </div>

            <label style={{ fontSize: 13, color: "#64748b", display: "block", marginBottom: 6 }}>
              Cash Received
            </label>
            <input
              type="number"
              placeholder="0.00"
              value={cashReceived}
              onChange={e => setCashReceived(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid #e2e8f0",
                background: "#f8fafc",
                color: "#0f172a",
                fontSize: 14,
                marginBottom: "0.75rem",
                boxSizing: "border-box",
              }}
            />

            {cashReceived && Number(cashReceived) >= total && total > 0 && (
              <p style={{ fontSize: 13, color: "#16a34a", margin: "0 0 0.75rem" }}>
                Change: ₱{change.toFixed(2)}
              </p>
            )}

            {error && (
              <p style={{ fontSize: 13, color: "#ef4444", margin: "0 0 0.75rem" }}>{error}</p>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={clearOrder}
                disabled={processing}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 10,
                  border: "1px solid #ef4444",
                  background: "#fff",
                  color: "#ef4444",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteSale}
                disabled={processing || cart.length === 0}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 10,
                  border: "none",
                  background: processing || cart.length === 0 ? "#94a3b8" : "#0f172a",
                  color: "#fff",
                  fontWeight: 600,
                  cursor: processing || cart.length === 0 ? "not-allowed" : "pointer",
                }}
              >
                {processing ? "Processing..." : "Complete Sale"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Simple receipt confirmation modal */}
      {receipt && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50,
        }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: "1.75rem", width: 320 }}>
            <h3 style={{ marginTop: 0, fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
              Sale Complete
              <FontAwesomeIcon icon={faCheckCircle} style={{ color: "#16a34a", width: 16, height: 16 }} />
            </h3>
            {receipt.items.map(it => (
              <div key={it.inventory_id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                <span>{it.product} × {it.quantity}</span>
                <span>₱{it.amount.toFixed(2)}</span>
              </div>
            ))}
            <div style={{ borderTop: "1px solid #f1f5f9", marginTop: 10, paddingTop: 10, fontSize: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                <span>Total</span><span>₱{receipt.total_amount.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b" }}>
                <span>Cash</span><span>₱{receipt.cash_received.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#16a34a", fontWeight: 600 }}>
                <span>Change</span><span>₱{receipt.change_amount.toFixed(2)}</span>
              </div>
            </div>
            <button
              onClick={() => setReceipt(null)}
              style={{ marginTop: 16, width: "100%", padding: "10px 0", borderRadius: 10, border: "none", background: "#0f172a", color: "#fff", fontWeight: 600, cursor: "pointer" }}
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
  width: 22,
  height: 22,
  borderRadius: 6,
  border: "1px solid #e2e8f0",
  background: "#fff",
  cursor: "pointer",
  fontSize: 13,
  lineHeight: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
