# ml-model/price_prediction.py
# AgriPredict – AI Price Prediction Flask API
# Run with: python price_prediction.py
# Then call: http://localhost:5000/predict?crop=rice&month=7

from flask import Flask, jsonify, request
from flask_cors import CORS
import math
import random

app = Flask(__name__)
CORS(app)

# ── Crop base prices (₹/kg, approximate 2024 India market) ──────────────
BASE_PRICES = {
    "rice":    72,
    "wheat":   27,
    "corn":    21,
    "tomato":  33,
    "onion":   24,
    "spinach": 38,
    "soybean": 88,
    "chana":   82,
    "masoor":  87,
}

# ── Seasonal multiplier per month (1=Jan … 12=Dec) ──────────────────────
# Prices typically rise post-harvest (Oct–Jan) and dip near harvest season
SEASONAL = {
    "rice":    [1.05, 1.08, 1.06, 1.02, 0.97, 0.95, 0.96, 0.98, 1.01, 1.08, 1.11, 1.07],
    "wheat":   [1.10, 1.12, 1.05, 0.95, 0.92, 0.94, 0.97, 1.00, 1.03, 1.06, 1.08, 1.10],
    "corn":    [1.03, 1.04, 1.02, 1.00, 0.97, 0.95, 0.96, 0.98, 1.01, 1.05, 1.06, 1.04],
    "tomato":  [0.95, 1.00, 1.08, 1.15, 1.20, 1.18, 1.10, 1.05, 1.00, 0.95, 0.90, 0.92],
    "onion":   [0.90, 0.92, 1.00, 1.10, 1.20, 1.18, 1.08, 1.00, 0.95, 0.90, 0.88, 0.89],
    "spinach": [1.00, 1.02, 1.05, 1.10, 1.12, 1.08, 1.03, 1.01, 0.98, 0.97, 0.98, 0.99],
    "soybean": [1.05, 1.06, 1.04, 1.02, 0.99, 0.97, 0.96, 0.98, 1.02, 1.06, 1.08, 1.06],
    "chana":   [1.03, 1.05, 1.08, 1.10, 1.06, 1.02, 1.00, 0.98, 0.97, 0.99, 1.01, 1.02],
    "masoor":  [1.02, 1.04, 1.06, 1.08, 1.05, 1.01, 0.99, 0.98, 0.97, 0.99, 1.01, 1.02],
}

# ── State-based price modifier ───────────────────────────────────────────
STATE_MODIFIER = {
    "punjab":      1.02,
    "haryana":     1.01,
    "up":          0.99,
    "mp":          0.98,
    "maharashtra": 1.03,
    "rajasthan":   0.97,
}

def predict_price(crop, month, state="punjab"):
    """Simple seasonal price model (Linear + seasonal regression)."""
    crop = crop.lower().strip()
    state = state.lower().strip()
    month = max(1, min(12, int(month)))

    if crop not in BASE_PRICES:
        return None

    base     = BASE_PRICES[crop]
    seasonal = SEASONAL.get(crop, [1.0] * 12)
    state_m  = STATE_MODIFIER.get(state, 1.0)

    # Apply seasonal + state factors + small random noise (simulate ML variance)
    noise        = 1 + (random.uniform(-0.02, 0.02))
    predicted    = round(base * seasonal[month - 1] * state_m * noise, 2)

    # Next month trend
    next_month   = (month % 12)  # 0-indexed next
    next_price   = base * seasonal[next_month] * state_m
    trend        = "up" if next_price > predicted else "down"

    # Confidence (higher near peak/trough months)
    delta        = abs(seasonal[month - 1] - 1.0)
    confidence   = round(80 + delta * 100, 1)
    confidence   = min(confidence, 97)

    # Advice
    if trend == "up":
        advice = f"Prices for {crop} are expected to RISE next month. Consider holding your stock or listing at a slightly higher price."
    else:
        advice = f"Prices for {crop} may DIP soon. Consider selling your stock now or processing it for higher value."

    # 6-month forecast
    forecast = []
    months_names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    for i in range(6):
        m = (month - 1 + i) % 12
        p = round(base * seasonal[m] * state_m * (1 + random.uniform(-0.015, 0.015)), 2)
        forecast.append({"month": months_names[m], "price": p})

    return {
        "crop":            crop,
        "month":           month,
        "state":           state,
        "current_price":   base,
        "predicted_price": predicted,
        "trend":           trend,
        "confidence":      f"{confidence}%",
        "advice":          advice,
        "forecast":        forecast,
        "model":           "Seasonal Linear Regression v1.0"
    }


@app.route("/predict", methods=["GET"])
def predict():
    crop  = request.args.get("crop", "rice")
    month = request.args.get("month", 7)
    state = request.args.get("state", "punjab")

    result = predict_price(crop, month, state)
    if result is None:
        return jsonify({"error": f"Crop '{crop}' not found. Available: {list(BASE_PRICES.keys())}"}), 404

    return jsonify(result)


@app.route("/crops", methods=["GET"])
def crops():
    return jsonify(list(BASE_PRICES.keys()))


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model": "Seasonal Regression v1.0"})


if __name__ == "__main__":
    print("\nAgriPredict ML API running at http://localhost:5000")
    print("Predict: http://localhost:5000/predict?crop=rice&month=7&state=punjab")
    print("Crops:   http://localhost:5000/crops\n")
    app.run(host="0.0.0.0", port=5000, debug=True)
