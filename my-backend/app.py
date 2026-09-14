from flask import Flask, jsonify, request
from flask_cors import CORS
from statsmodels.tsa.holtwinters import SimpleExpSmoothing
import pymysql
import pandas as pd
import numpy as np
from datetime import date, timedelta
from collections import defaultdict

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})


# =========================
# DATABASE CONNECTION
# =========================

def get_db():
    return pymysql.connect(
        host="maglev.proxy.rlwy.net",
        port=54682,
        user="root",
        password="PSwLAvsFsjMOExfoKnOdvzcRPbqqXoyp",
        database="railway",
        cursorclass=pymysql.cursors.DictCursor
    )


# =========================
# SALES
# =========================

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
        (
            data['product'],
            data['amount'],
            data['date']
        )
    )

    conn.commit()

    new_id = cursor.lastrowid

    conn.close()

    return jsonify({
        "message": "Sale added!",
        "sale": {
            "id": new_id,
            "product": data['product'],
            "amount": data['amount'],
            "date": data['date']
        }
    }), 201


@app.route('/sales/<int:sale_id>', methods=['DELETE'])
def delete_sale(sale_id):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute(
        "DELETE FROM sales WHERE id = %s",
        (sale_id,)
    )

    conn.commit()
    conn.close()

    return jsonify({
        "message": "Deleted!"
    })


# =========================
# INVENTORY
# =========================

@app.route('/inventory', methods=['GET', 'POST', 'OPTIONS'])
def inventory():

    if request.method == 'OPTIONS':
        return jsonify({}), 200

    # GET INVENTORY
    if request.method == 'GET':
        conn = get_db()
        cursor = conn.cursor()

        cursor.execute(
            "SELECT * FROM inventory ORDER BY id DESC"
        )

        data = cursor.fetchall()

        conn.close()

        return jsonify(data)

    # ADD INVENTORY
    if request.method == 'POST':
        data = request.json

        conn = get_db()
        cursor = conn.cursor()

        cursor.execute(
            """
            INSERT INTO inventory
            (product, stock, price, reorder_level, expiry_date)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (
                data['product'],
                data['stock'],
                data.get('price', 0),
                data['reorder_level'],
                data.get('expiry_date') or None
            )
        )

        conn.commit()

        new_id = cursor.lastrowid

        conn.close()

        return jsonify({
            "message": "Item added!",
            "item": {
                "id": new_id,
                "product": data['product'],
                "stock": int(data['stock']),
                "price": float(data.get('price', 0)),
                "reorder_level": int(data['reorder_level']),
                "expiry_date": data.get('expiry_date') or None
            }
        }), 201


@app.route('/inventory/<int:item_id>', methods=['PUT'])
def update_inventory(item_id):
    data = request.json

    conn = get_db()
    cursor = conn.cursor()

    fields = []
    values = []

    if 'stock' in data:
        fields.append("stock = %s")
        values.append(data['stock'])

    if 'price' in data:
        fields.append("price = %s")
        values.append(data['price'])

    if not fields:
        conn.close()

        return jsonify({
            "error": "No fields to update"
        }), 400

    values.append(item_id)

    cursor.execute(
        f"""
        UPDATE inventory
        SET {', '.join(fields)}
        WHERE id = %s
        """,
        values
    )

    conn.commit()
    conn.close()

    return jsonify({
        "message": "Inventory updated!"
    })


# =========================
# POS SINGLE SALE
# =========================

@app.route('/pos-sale', methods=['POST'])
def pos_sale():
    data = request.json

    inventory_id = data.get('inventory_id')
    quantity = data.get('quantity')
    sale_date = data.get('date')

    if not inventory_id or not quantity or not sale_date:
        return jsonify({
            "error": "inventory_id, quantity, and date are required"
        }), 400

    conn = get_db()
    cursor = conn.cursor()

    try:

        # Lock the row and check stock before deducting
        cursor.execute(
            "SELECT * FROM inventory WHERE id = %s FOR UPDATE",
            (inventory_id,)
        )

        item = cursor.fetchone()

        if not item:
            conn.close()

            return jsonify({
                "error": "Product not found"
            }), 404

        if item['stock'] < quantity:
            conn.close()

            return jsonify({
                "error": f"Not enough stock. Available: {item['stock']}"
            }), 400

        amount = float(item['price']) * int(quantity)

        # Insert sale
        cursor.execute(
            """
            INSERT INTO sales
            (inventory_id, product, quantity, amount, date)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (
                inventory_id,
                item['product'],
                quantity,
                amount,
                sale_date
            )
        )

        new_sale_id = cursor.lastrowid

        # Deduct inventory stock
        cursor.execute(
            """
            UPDATE inventory
            SET stock = stock - %s
            WHERE id = %s
            """,
            (
                quantity,
                inventory_id
            )
        )

        conn.commit()

    except Exception as e:

        conn.rollback()
        conn.close()

        return jsonify({
            "error": str(e)
        }), 500

    conn.close()

    return jsonify({
        "message": "Sale recorded and stock updated!",
        "sale": {
            "id": new_sale_id,
            "inventory_id": inventory_id,
            "product": item['product'],
            "quantity": quantity,
            "amount": amount,
            "date": sale_date
        },
        "remaining_stock": item['stock'] - quantity
    }), 201


# =========================
# POS CHECKOUT
# =========================

@app.route('/pos-checkout', methods=['POST'])
def pos_checkout():
    data = request.json

    items = data.get('items')
    cash_received = data.get('cash_received')
    sale_date = data.get('date')

    # Expected items format:
    # [
    #     {
    #         "inventory_id": 1,
    #         "quantity": 2
    #     }
    # ]

    if not items or len(items) == 0:
        return jsonify({
            "error": "Cart is empty"
        }), 400

    if cash_received is None or not sale_date:
        return jsonify({
            "error": "cash_received and date are required"
        }), 400

    conn = get_db()
    cursor = conn.cursor()

    try:

        # ---------------------------------
        # STEP 1:
        # Validate every cart item
        # before writing anything
        # ---------------------------------

        validated_items = []
        total_amount = 0

        for entry in items:

            inventory_id = entry.get('inventory_id')
            quantity = entry.get('quantity')

            if not inventory_id or not quantity or quantity <= 0:
                raise ValueError(
                    f"Invalid item in cart: {entry}"
                )

            # Lock inventory row
            cursor.execute(
                """
                SELECT *
                FROM inventory
                WHERE id = %s
                FOR UPDATE
                """,
                (inventory_id,)
            )

            item = cursor.fetchone()

            if not item:
                raise ValueError(
                    f"Product with id {inventory_id} not found"
                )

            if item['stock'] < quantity:
                raise ValueError(
                    f"Not enough stock for {item['product']}. "
                    f"Available: {item['stock']}"
                )

            line_amount = float(item['price']) * int(quantity)

            total_amount += line_amount

            validated_items.append({
                "inventory_id": inventory_id,
                "product": item['product'],
                "quantity": quantity,
                "amount": line_amount
            })

        # ---------------------------------
        # STEP 2:
        # Check cash received
        # ---------------------------------

        if float(cash_received) < total_amount:
            raise ValueError(
                f"Cash received (₱{cash_received}) "
                f"is less than total (₱{total_amount})"
            )

        change_amount = (
            float(cash_received) - total_amount
        )

        # ---------------------------------
        # STEP 3:
        # Create transaction record
        # ---------------------------------

        cursor.execute(
            """
            INSERT INTO transactions
            (total_amount, cash_received, change_amount, date)
            VALUES (%s, %s, %s, %s)
            """,
            (
                total_amount,
                cash_received,
                change_amount,
                sale_date
            )
        )

        transaction_id = cursor.lastrowid

        # ---------------------------------
        # STEP 4:
        # Insert sale lines
        # and deduct stock
        # ---------------------------------

        for line in validated_items:

            cursor.execute(
                """
                INSERT INTO sales
                (
                    transaction_id,
                    inventory_id,
                    product,
                    quantity,
                    amount,
                    date
                )
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (
                    transaction_id,
                    line['inventory_id'],
                    line['product'],
                    line['quantity'],
                    line['amount'],
                    sale_date
                )
            )

            cursor.execute(
                """
                UPDATE inventory
                SET stock = stock - %s
                WHERE id = %s
                """,
                (
                    line['quantity'],
                    line['inventory_id']
                )
            )

        # ---------------------------------
        # STEP 5:
        # Commit transaction
        # ---------------------------------

        conn.commit()

    except ValueError as ve:

        conn.rollback()
        conn.close()

        return jsonify({
            "error": str(ve)
        }), 400

    except Exception as e:

        conn.rollback()
        conn.close()

        return jsonify({
            "error": str(e)
        }), 500

    conn.close()

    return jsonify({
        "message": "Checkout complete!",
        "transaction_id": transaction_id,
        "items": validated_items,
        "total_amount": total_amount,
        "cash_received": float(cash_received),
        "change_amount": change_amount
    }), 201


# =========================
# DELETE INVENTORY
# =========================

@app.route('/inventory/<int:item_id>', methods=['DELETE'])
def delete_inventory(item_id):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute(
        "DELETE FROM inventory WHERE id = %s",
        (item_id,)
    )

    conn.commit()
    conn.close()

    return jsonify({
        "message": "Deleted!"
    })


# =========================
# SALES FORECAST
# =========================

@app.route('/forecast', methods=['GET'])
def get_forecast():

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT date, SUM(amount) as total
        FROM sales
        GROUP BY date
        ORDER BY date ASC
        """
    )

    rows = cursor.fetchall()

    conn.close()

    if len(rows) < 3:
        return jsonify({
            "error": "Not enough data. "
                     "Add at least 3 sales records "
                     "on different dates."
        }), 400

    df = pd.DataFrame(rows)

    df['date'] = pd.to_datetime(df['date'])

    df = df.set_index('date')

    df['total'] = df['total'].astype(float)

    # Simple Exponential Smoothing
    model = SimpleExpSmoothing(
        df['total']
    ).fit(
        optimized=True
    )

    # Forecast next 7 days
    forecast_values = model.forecast(7)

    # Historical data
    historical = [
        {
            "date": str(row['date']),
            "amount": float(row['total'])
        }
        for row in rows
    ]

    # Forecast dates
    last_date = df.index[-1]

    forecast_dates = pd.date_range(
        start=last_date + pd.Timedelta(days=1),
        periods=7
    )

    forecast = [
        {
            "date": str(d.date()),
            "amount": round(float(v), 2)
        }
        for d, v in zip(
            forecast_dates,
            forecast_values
        )
    ]

    # Model accuracy
    fitted = model.fittedvalues

    mae = round(
        float(
            np.mean(
                np.abs(
                    df['total'].values -
                    fitted.values
                )
            )
        ),
        2
    )

    rmse = round(
        float(
            np.sqrt(
                np.mean(
                    (
                        df['total'].values -
                        fitted.values
                    ) ** 2
                )
            )
        ),
        2
    )

    return jsonify({
        "historical": historical,
        "forecast": forecast,
        "mae": mae,
        "rmse": rmse,
        "method": "Simple Exponential Smoothing"
    })


# =========================
# EXPIRY TRACKING
# =========================

@app.route('/expiry', methods=['GET'])
def get_expiry():

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT *
        FROM inventory
        WHERE expiry_date IS NOT NULL
        ORDER BY expiry_date ASC
        """
    )

    data = cursor.fetchall()

    conn.close()

    today = date.today()

    result = []

    for item in data:

        exp = item['expiry_date']

        days_left = (
            exp - today
        ).days

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


# =========================
# RECOMMENDATIONS
# Rule-based, no external AI API
# =========================

# Logic overview:
#
# 1. For each product, calculate sales velocity.
#    Sales velocity = total quantity sold /
#    number of days since the first sale.
#
# 2. Calculate estimated days until stockout.
#    Days to stockout = current stock / sales velocity.
#
# 3. Combine stock and expiry information.
#
# 4. Generate recommendations:
#    - URGENT: stock will run out within 2 days
#    - SOON: expires within 7 days and is unlikely
#            to sell through before expiry
#    - MONITOR: stock is at or below reorder level


URGENT_STOCKOUT_DAYS = 2
DISCOUNT_EXPIRY_DAYS = 7
REORDER_TARGET_DAYS = 7


@app.route('/recommendations', methods=['GET'])
def get_recommendations():

    conn = get_db()
    cursor = conn.cursor()

    # ---------------------------------
    # 1. GET SALES VELOCITY PER PRODUCT
    # ---------------------------------

    cursor.execute("""
        SELECT
            inventory_id,
            SUM(quantity) AS total_qty,
            MIN(date) AS first_date,
            MAX(date) AS last_date
        FROM sales
        WHERE inventory_id IS NOT NULL
        GROUP BY inventory_id
    """)

    velocity_rows = cursor.fetchall()

    velocity_map = {}

    for row in velocity_rows:

        first_date = row['first_date']
        last_date = row['last_date']

        # Number of days between first and last sale
        span_days = (
            last_date - first_date
        ).days + 1

        span_days = max(span_days, 1)

        velocity_map[row['inventory_id']] = (
            float(row['total_qty']) / span_days
        )

    # ---------------------------------
    # 2. GET CURRENT INVENTORY
    # ---------------------------------

    cursor.execute("""
        SELECT *
        FROM inventory
        ORDER BY id
    """)

    inventory_rows = cursor.fetchall()

    # ---------------------------------
    # 3. GET EXPIRY INFORMATION
    # ---------------------------------

    today = date.today()

    expiry_map = {}

    for item in inventory_rows:

        exp = item.get('expiry_date')

        if exp:

            days_left = (
                exp - today
            ).days

            expiry_map[item['id']] = days_left

    conn.close()

    # ---------------------------------
    # 4. GENERATE RECOMMENDATIONS
    # ---------------------------------

    recommendations = []

    for item in inventory_rows:

        item_id = item['id']

        stock = int(item['stock'])

        reorder_level = int(
            item['reorder_level']
        )

        # Units sold per day
        velocity = velocity_map.get(
            item_id,
            0
        )

        # Estimated days until stockout
        if velocity > 0:

            days_to_stockout = (
                stock / velocity
            )

        else:

            days_to_stockout = None

        days_left_expiry = expiry_map.get(
            item_id
        )

        # ---------------------------------
        # URGENT:
        # Stock will run out soon
        # ---------------------------------

        if (
            days_to_stockout is not None
            and days_to_stockout <= URGENT_STOCKOUT_DAYS
        ):

            suggested_qty = max(
                round(
                    velocity * REORDER_TARGET_DAYS
                ) - stock,
                1
            )

            recommendations.append({

                "priority": "urgent",

                "action": "Order Now",

                "product": item['product'],

                "inventory_id": item_id,

                "reason": (
                    f"Stockout in "
                    f"{max(round(days_to_stockout), 0)} "
                    f"day(s) at current sales pace"
                ),

                "detail": (
                    f"Order {suggested_qty} units"
                ),

                "suggested_quantity": suggested_qty

            })

            # Don't also classify as monitor
            continue

        # ---------------------------------
        # SOON:
        # Expiring soon and unlikely
        # to sell before expiry
        # ---------------------------------

        if (
            days_left_expiry is not None
            and 0 <= days_left_expiry <= DISCOUNT_EXPIRY_DAYS
        ):

            will_sell_through_in_time = (

                days_to_stockout is not None
                and days_to_stockout <= days_left_expiry

            )

            if not will_sell_through_in_time:

                recommendations.append({

                    "priority": "soon",

                    "action": "Apply Discount",

                    "product": item['product'],

                    "inventory_id": item_id,

                    "reason": (
                        f"Expires in "
                        f"{days_left_expiry} day(s), "
                        f"unlikely to sell through in time"
                    ),

                    "detail": (
                        "Consider a 10-20% discount "
                        "to move stock"
                    ),

                    "suggested_quantity": None

                })

                continue

        # ---------------------------------
        # MONITOR:
        # Stock reached reorder level
        # ---------------------------------

        if stock <= reorder_level:

            suggested_qty = max(
                reorder_level * 2 - stock,
                reorder_level
            )

            recommendations.append({

                "priority": "monitor",

                "action": "Restock Soon",

                "product": item['product'],

                "inventory_id": item_id,

                "reason": "Reorder level reached",

                "detail": (
                    f"Suggested: {suggested_qty} units"
                ),

                "suggested_quantity": suggested_qty

            })

    # ---------------------------------
    # 5. SORT RECOMMENDATIONS
    # ---------------------------------

    priority_order = {
        "urgent": 0,
        "soon": 1,
        "monitor": 2
    }

    recommendations.sort(
        key=lambda r: priority_order[
            r["priority"]
        ]
    )

    return jsonify(recommendations)


# =========================
# REPORTS HELPERS
# =========================

def get_period_range(period):
    """
    Returns (start_date, end_date)
    for the requested period.
    """

    today = date.today()

    if period == 'last_month':

        first_of_this_month = today.replace(day=1)

        last_month_end = (
            first_of_this_month - timedelta(days=1)
        )

        start = last_month_end.replace(day=1)

        end = last_month_end

    else:

        # Default: this_month
        start = today.replace(day=1)
        end = today

    return start, end


def get_prev_period_range(period):
    """
    Returns the equivalent-length period
    immediately before the given one.
    """

    start, end = get_period_range(period)

    period_len = (
        end - start
    ).days + 1

    prev_end = (
        start - timedelta(days=1)
    )

    prev_start = (
        prev_end - timedelta(days=period_len - 1)
    )

    return prev_start, prev_end


def compute_inventory_status(item, today):
    """
    Same status logic used for the
    Inventory Health breakdown.
    """

    exp = item.get('expiry_date')

    if exp:

        days_left = (
            exp - today
        ).days

        if days_left < 0:
            return "Expired"

        if days_left <= 3:
            return "Critical"

    stock = int(item['stock'])

    reorder_level = int(
        item['reorder_level']
    )

    if stock == 0:
        return "Critical"

    if stock <= reorder_level:
        return "Low Stock"

    return "OK"


def pct_change(curr, prev):

    if not prev:
        return None

    return round(
        (curr - prev) / prev * 100,
        1
    )


# =========================
# REPORTS
# =========================

@app.route('/reports', methods=['GET'])
def get_reports():

    period = request.args.get(
        'period',
        'this_month'
    )

    # Only allow valid periods
    if period not in ['this_month', 'last_month']:
        period = 'this_month'

    start, end = get_period_range(
        period
    )

    prev_start, prev_end = get_prev_period_range(
        period
    )

    conn = get_db()
    cursor = conn.cursor()

    # ---------------------------------
    # TOTAL SALES
    # Current + previous period
    # ---------------------------------

    cursor.execute(
        """
        SELECT COALESCE(SUM(amount), 0) AS total
        FROM sales
        WHERE date BETWEEN %s AND %s
        """,
        (
            start,
            end
        )
    )

    total_sales = float(
        cursor.fetchone()['total']
    )

    cursor.execute(
        """
        SELECT COALESCE(SUM(amount), 0) AS total
        FROM sales
        WHERE date BETWEEN %s AND %s
        """,
        (
            prev_start,
            prev_end
        )
    )

    total_sales_prev = float(
        cursor.fetchone()['total']
    )

    # ---------------------------------
    # TOTAL TRANSACTIONS
    #
    # Distinct transaction_id +
    # rows with no transaction_id
    #
    # Manual/single POS sales don't
    # necessarily have transaction_id.
    # ---------------------------------

    def count_transactions(
        range_start,
        range_end
    ):

        cursor.execute(
            """
            SELECT
                COUNT(
                    DISTINCT CASE
                        WHEN transaction_id IS NOT NULL
                        THEN transaction_id
                    END
                ) AS with_id,

                SUM(
                    CASE
                        WHEN transaction_id IS NULL
                        THEN 1
                        ELSE 0
                    END
                ) AS without_id

            FROM sales

            WHERE date BETWEEN %s AND %s
            """,
            (
                range_start,
                range_end
            )
        )

        row = cursor.fetchone()

        return (
            int(row['with_id'] or 0)
            +
            int(row['without_id'] or 0)
        )

    total_transactions = count_transactions(
        start,
        end
    )

    total_transactions_prev = count_transactions(
        prev_start,
        prev_end
    )

    # ---------------------------------
    # AVERAGE DAILY SALES
    # ---------------------------------

    days_elapsed = (
        end - start
    ).days + 1

    prev_days = (
        prev_end - prev_start
    ).days + 1

    avg_daily_sales = (
        total_sales / days_elapsed
        if days_elapsed
        else 0
    )

    avg_daily_sales_prev = (
        total_sales_prev / prev_days
        if prev_days
        else 0
    )

    # ---------------------------------
    # TOP 5 PRODUCTS BY UNITS SOLD
    #
    # Only counts sales with quantity.
    # ---------------------------------

    cursor.execute(
        """
        SELECT
            product,
            SUM(quantity) AS units_sold

        FROM sales

        WHERE
            date BETWEEN %s AND %s
            AND quantity IS NOT NULL

        GROUP BY product

        ORDER BY units_sold DESC

        LIMIT 5
        """,
        (
            start,
            end
        )
    )

    top_products = [
        {
            "product": r['product'],
            "units_sold": int(
                r['units_sold']
            )
        }
        for r in cursor.fetchall()
    ]

    best_selling_product = (
        top_products[0]
        if top_products
        else None
    )

    # ---------------------------------
    # INVENTORY HEALTH BREAKDOWN
    # ---------------------------------

    cursor.execute(
        "SELECT * FROM inventory"
    )

    inventory_rows = cursor.fetchall()

    today = date.today()

    health_counts = {
        "OK": 0,
        "Low Stock": 0,
        "Critical": 0,
        "Expired": 0
    }

    for item in inventory_rows:

        status = compute_inventory_status(
            item,
            today
        )

        health_counts[status] += 1

    total_items = (
        len(inventory_rows)
        or 1
    )

    inventory_health = {
        key: round(
            value / total_items * 100,
            1
        )
        for key, value in health_counts.items()
    }

    # ---------------------------------
    # PER-PRODUCT FORECAST ACCURACY
    #
    # Same method as /forecast,
    # run separately per product.
    # ---------------------------------

    cursor.execute(
        """
        SELECT
            product,
            date,
            SUM(amount) AS total

        FROM sales

        WHERE quantity IS NOT NULL

        GROUP BY product, date

        ORDER BY product, date
        """
    )

    all_rows = cursor.fetchall()

    conn.close()

    product_series = defaultdict(list)

    for r in all_rows:

        product_series[
            r['product']
        ].append(
            (
                r['date'],
                float(r['total'])
            )
        )

    forecast_accuracy = []

    for product, rows in product_series.items():

        # Need at least 4 data points
        if len(rows) < 4:
            continue

        dates_list = [
            r[0]
            for r in rows
        ]

        values = [
            r[1]
            for r in rows
        ]

        series = pd.Series(
            values,
            index=pd.to_datetime(
                dates_list
            )
        )

        try:

            model = SimpleExpSmoothing(
                series
            ).fit(
                optimized=True
            )

            fitted = model.fittedvalues

            residuals = np.abs(
                series.values -
                fitted.values
            )

            mae = round(
                float(
                    np.mean(residuals)
                ),
                2
            )

            rmse = round(
                float(
                    np.sqrt(
                        np.mean(
                            residuals ** 2
                        )
                    )
                ),
                2
            )

            half = (
                len(residuals) // 2
            )

            first_half_avg = (
                np.mean(
                    residuals[:half]
                )
                if half > 0
                else np.mean(residuals)
            )

            second_half_avg = np.mean(
                residuals[half:]
            )

            trend = (
                "Improving"
                if second_half_avg <= first_half_avg
                else "Declining"
            )

            forecast_accuracy.append({
                "product": product,
                "mae": mae,
                "rmse": rmse,
                "trend": trend
            })

        except Exception:
            # Skip products whose series
            # cannot be fitted
            continue

    forecast_accuracy.sort(
        key=lambda x: x['product']
    )

    # ---------------------------------
    # INSIGHT TEXT
    # ---------------------------------

    insight_parts = []

    if total_sales_prev == 0:

        insight_parts.append(
            "This is your first period "
            "with recorded sales."
        )

    elif total_sales >= total_sales_prev:

        insight_parts.append(
            "Your sales are trending "
            "upward this period!"
        )

    else:

        insight_parts.append(
            "Your sales dipped compared "
            "to last period."
        )

    if top_products:

        names = ", ".join(
            p['product']
            for p in top_products[:3]
        )

        insight_parts.append(
            f"{names} are your top performers. "
            f"Consider maintaining higher "
            f"stock levels for these items "
            f"to avoid stockouts during peak demand."
        )

    insight = " ".join(
        insight_parts
    )

    # ---------------------------------
    # FINAL REPORT RESPONSE
    # ---------------------------------

    return jsonify({

        "period": period,

        "total_sales": round(
            total_sales,
            2
        ),

        "total_sales_change_pct": pct_change(
            total_sales,
            total_sales_prev
        ),

        "total_transactions": total_transactions,

        "total_transactions_change_pct": pct_change(
            total_transactions,
            total_transactions_prev
        ),

        "avg_daily_sales": round(
            avg_daily_sales,
            2
        ),

        "avg_daily_sales_prev": round(
            avg_daily_sales_prev,
            2
        ),

        "best_selling_product":
            best_selling_product,

        "top_products":
            top_products,

        "inventory_health":
            inventory_health,

        "forecast_accuracy":
            forecast_accuracy,

        "insight":
            insight
    })


# =========================
# LOGIN
# =========================

@app.route('/login', methods=['POST'])
def login():

    data = request.json

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT *
        FROM users
        WHERE email = %s
        AND password = %s
        """,
        (
            data['email'],
            data['password']
        )
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

        return jsonify({
            "error": "Invalid email or password."
        }), 401


# =========================
# RUN FLASK SERVER
# =========================

if __name__ == '__main__':
    app.run(debug=True)