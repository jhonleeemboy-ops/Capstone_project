from flask import Flask, jsonify, request
from flask_cors import CORS
from statsmodels.tsa.holtwinters import SimpleExpSmoothing
import pymysql
import pandas as pd
import numpy as np
from datetime import date

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

def get_db():
    return pymysql.connect(
        host="localhost",
        user="root",
        password="",
        database="sales_dss",
        cursorclass=pymysql.cursors.DictCursor
    )

@app.route('/sales', methods=['GET'])
def get_sales():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM sales ORDER BY date DESC")
    data = cursor.fetchall()
    conn.close()
    return jsonify(data)

@app.route('/sales', methods=['POST'])
def add_sale():
    data = request.json
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO sales (product, amount, date) VALUES (%s, %s, %s)",
        (data['product'], data['amount'], data['date'])
    )
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    return jsonify({"message": "Sale added!", "sale": {
        "id": new_id,
        "product": data['product'],
        "amount": data['amount'],
        "date": data['date']
    }}), 201

@app.route('/sales/<int:sale_id>', methods=['DELETE'])
def delete_sale(sale_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM sales WHERE id = %s", (sale_id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Deleted!"})

@app.route('/inventory', methods=['GET', 'POST', 'OPTIONS'])
def inventory():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    if request.method == 'GET':
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM inventory ORDER BY id DESC")
        data = cursor.fetchall()
        conn.close()
        return jsonify(data)
    if request.method == 'POST':
        data = request.json
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO inventory (product, stock, reorder_level, expiry_date) VALUES (%s, %s, %s, %s)",
            (data['product'], data['stock'], data['reorder_level'], data.get('expiry_date') or None)
        )
        conn.commit()
        new_id = cursor.lastrowid
        conn.close()
        return jsonify({"message": "Item added!", "item": {
            "id": new_id,
            "product": data['product'],
            "stock": int(data['stock']),
            "reorder_level": int(data['reorder_level']),
            "expiry_date": data.get('expiry_date') or None
        }}), 201

@app.route('/inventory/<int:item_id>', methods=['PUT'])
def update_inventory(item_id):
    data = request.json
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE inventory SET stock = %s WHERE id = %s",
        (data['stock'], item_id)
    )
    conn.commit()
    conn.close()
    return jsonify({"message": "Stock updated!"})

@app.route('/inventory/<int:item_id>', methods=['DELETE'])
def delete_inventory(item_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM inventory WHERE id = %s", (item_id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Deleted!"})

@app.route('/forecast', methods=['GET'])
def get_forecast():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT date, SUM(amount) as total
        FROM sales
        GROUP BY date
        ORDER BY date ASC
    """)
    rows = cursor.fetchall()
    conn.close()

    if len(rows) < 3:
        return jsonify({"error": "Not enough data. Add at least 3 sales records on different dates."}), 400

    df = pd.DataFrame(rows)
    df['date'] = pd.to_datetime(df['date'])
    df = df.set_index('date')
    df['total'] = df['total'].astype(float)

    model = SimpleExpSmoothing(df['total']).fit(optimized=True)
    forecast_values = model.forecast(7)

    historical = [
        {"date": str(row['date']), "amount": float(row['total'])}
        for row in rows
    ]

    last_date = df.index[-1]
    forecast_dates = pd.date_range(start=last_date + pd.Timedelta(days=1), periods=7)
    forecast = [
        {"date": str(d.date()), "amount": round(float(v), 2)}
        for d, v in zip(forecast_dates, forecast_values)
    ]

    fitted = model.fittedvalues
    mae = round(float(np.mean(np.abs(df['total'].values - fitted.values))), 2)
    rmse = round(float(np.sqrt(np.mean((df['total'].values - fitted.values) ** 2))), 2)

    return jsonify({
        "historical": historical,
        "forecast": forecast,
        "mae": mae,
        "rmse": rmse,
        "method": "Simple Exponential Smoothing"
    })

@app.route('/expiry', methods=['GET'])
def get_expiry():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM inventory
        WHERE expiry_date IS NOT NULL
        ORDER BY expiry_date ASC
    """)
    data = cursor.fetchall()
    conn.close()

    today = date.today()
    result = []
    for item in data:
        exp = item['expiry_date']
        days_left = (exp - today).days
        if days_left < 0:
            status = "Expired"
        elif days_left <= 3:
            status = "Critical"
        elif days_left <= 7:
            status = "Expiring soon"
        else:
            status = "OK"
        result.append({
            "id": item['id'],
            "product": item['product'],
            "stock": item['stock'],
            "expiry_date": str(exp),
            "days_left": days_left,
            "status": status
        })
    return jsonify(result)


@app.route('/login', methods=['POST'])
def login():
    data = request.json
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM users WHERE email = %s AND password = %s",
        (data['email'], data['password'])
    )
    user = cursor.fetchone()
    conn.close()

    if user:
        return jsonify({
            "message": "Login successful!",
            "user": {
                "id": user['id'],
                "name": user['name'],
                "email": user['email'],
                "role": user['role']
            }
        })
    else:
        return jsonify({"error": "Invalid email or password."}), 401

if __name__ == '__main__':
    app.run(debug=True)