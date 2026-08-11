"""
Multi-State Court Fee Calculator Engine for Indian States & UTs
================================================================
Calculates Ad-Valorem Court Fees based on monetary valuation for:
- Andhra Pradesh & Telangana
- Assam
- Bihar & Jharkhand
- Delhi & Chandigarh
- Gujarat
- Haryana
- Himachal Pradesh
- Karnataka
- Kerala
- Maharashtra
- Punjab
- Rajasthan
- Tamil Nadu
- Uttar Pradesh & Uttarakhand
- West Bengal
"""

import math
from typing import Dict, Any, List

SUPPORTED_STATES: List[str] = [
    "Andhra Pradesh",
    "Assam",
    "Bihar",
    "Chandigarh",
    "Delhi",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Maharashtra",
    "Punjab",
    "Rajasthan",
    "Tamil Nadu",
    "Telangana",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal"
]


def calculate_state_court_fee(state: str, valuation: float) -> Dict[str, Any]:
    """
    Calculate ad-valorem court fee for the specified Indian state and monetary valuation.
    Returns calculated court fee, formatted string, and state details.
    """
    val = max(0.0, float(valuation or 0.0))
    st = (state or "Kerala").strip()
    fee = 0.0

    if val <= 0:
        return {
            "state": st,
            "valuation": val,
            "court_fee": 0.0,
            "formatted": f"Ad-Valorem Court Fees for valuation of ₹0/- for the State of {st} is ₹0/-"
        }

    # Haryana
    if st == "Haryana":
        if val <= 15000:
            fee = val * 0.025
        elif val <= 27000:
            fee = 375 + ((val - 15000) * 0.035)
        elif val <= 39000:
            fee = 795 + ((val - 27000) * 0.045)
        elif val <= 51000:
            fee = 1335 + ((val - 39000) * 0.055)
        elif val <= 63000:
            fee = 1995 + ((val - 51000) * 0.065)
        elif val <= 75000:
            fee = 2775 + ((val - 63000) * 0.075)
        elif val <= 500000:
            fee = 3675 + ((val - 75000) * 0.065)
        elif val <= 1000000:
            fee = 31300 + ((val - 500000) * 0.055)
        elif val <= 2000000:
            fee = 58800 + ((val - 1000000) * 0.045)
        elif val <= 3000000:
            fee = 103800 + ((val - 2000000) * 0.035)
        elif val <= 4500000:
            fee = 138000 + ((val - 3000000) * 0.025)
        elif val <= 6000000:
            fee = 176300 + ((val - 4500000) * 0.015)
        else:
            fee = 198800 + ((val - 6000000) * 0.005)

    # Tamil Nadu
    elif st == "Tamil Nadu":
        if val <= 5:
            fee = 0.5
        elif val <= 100:
            num = math.ceil((val - 5) / 5)
            fee = 0.5 + (0.5 * num)
        elif val <= 500:
            num = math.ceil((val - 100) / 10)
            fee = 10 + num
        elif val <= 1000:
            num = math.ceil((val - 500) / 10)
            fee = 50 + (1.5 * num)
        elif val <= 5000:
            num = math.ceil((val - 1000) / 100)
            fee = 125 + (12.2 * num)
        elif val <= 10000:
            num = math.ceil((val - 5000) / 250)
            fee = 613 + (24.4 * num)
        elif val <= 20000:
            num = math.ceil((val - 10000) / 500)
            fee = 1101 + (36.5 * num)
        elif val <= 30000:
            num = math.ceil((val - 20000) / 1000)
            fee = 1831 + (48.8 * num)
        elif val <= 50000:
            num = math.ceil((val - 30000) / 2000)
            fee = 2319 + (48.8 * num)
        else:
            num = math.ceil((val - 50000) / 5000)
            fee = 2563 + (48.8 * num)

    # Andhra Pradesh & Telangana
    elif st in ("Andhra Pradesh", "Telangana"):
        if val <= 100:
            num = math.ceil(val / 5)
            fee = 0.6 * num
        elif val <= 500:
            num = math.ceil((val - 100) / 10)
            fee = 8 + (0.8 * num)
        elif val <= 1000:
            num = math.ceil((val - 500) / 10)
            fee = 40 + (1.1 * num)
        elif val <= 10000:
            num = math.ceil((val - 1000) / 100)
            fee = 111 + (7 * num)
        elif val <= 20000:
            num = math.ceil((val - 10000) / 500)
            fee = 174 + (30 * num)
        elif val <= 30000:
            num = math.ceil((val - 20000) / 1000)
            fee = 774 + (40 * num)
        elif val <= 50000:
            num = math.ceil((val - 30000) / 2000)
            fee = 1174 + (60 * num)
        elif val <= 100000:
            num = math.ceil((val - 50000) / 4000)
            fee = 1774 + (80 * num)
        else:
            num = math.ceil((val - 100000) / 10000)
            fee = 2774 + (100 * num)

    # Assam
    elif st == "Assam":
        if val <= 100:
            num = math.ceil(val / 5)
            fee = 0.55 * num
        elif val <= 150:
            num = math.ceil((val - 100) / 10)
            fee = 11 + (1.95 * num)
        elif val <= 1000:
            num = math.ceil((val - 150) / 10)
            fee = 20.75 + (1.45 * num)
        elif val <= 7500:
            num = math.ceil((val - 1000) / 100)
            fee = 144 + (8.25 * num)
        elif val <= 10000:
            num = math.ceil((val - 7500) / 250)
            fee = 680.25 + (16.5 * num)
        elif val <= 20000:
            num = math.ceil((val - 10000) / 500)
            fee = 845.25 + (24.75 * num)
        elif val <= 50000:
            num = math.ceil((val - 20000) / 1000)
            fee = 1340.25 + (33 * num)
        else:
            num = math.ceil((val - 50000) / 5000)
            fee = 2330.25 + (41.25 * num)
        fee = min(fee, 11000.0)

    # Bihar & Jharkhand
    elif st in ("Bihar", "Jharkhand"):
        if val < 6:
            fee = 0.0
        elif val <= 100:
            num = math.ceil(val / 5)
            fee = float(num)
        elif val <= 1000:
            num = math.ceil((val - 100) / 10)
            fee = 20 + (2 * num)
        elif val <= 5000:
            num = math.ceil((val - 1000) / 100)
            fee = 200 + (16 * num)
        elif val <= 10000:
            num = math.ceil((val - 5000) / 250)
            fee = 840 + (32 * num)
        elif val <= 20000:
            num = math.ceil((val - 10000) / 500)
            fee = 1480 + (48 * num)
        elif val <= 30000:
            num = math.ceil((val - 20000) / 1000)
            fee = 2440 + (64 * num)
        elif val <= 50000:
            num = math.ceil((val - 30000) / 2000)
            fee = 3080 + (64 * num)
        else:
            num = math.ceil((val - 50000) / 5000)
            fee = 3720 + (80 * num)
        fee = min(fee, 50000.0)

    # Delhi, Chandigarh, Himachal Pradesh
    elif st in ("Delhi", "Chandigarh", "Himachal Pradesh"):
        if val <= 100:
            num = math.ceil(val / 5)
            fee = float(num)
        elif val <= 500:
            num = math.ceil((val - 100) / 10)
            fee = 20 + num
        elif val <= 1000:
            num = math.ceil((val - 500) / 10)
            fee = 60 + (2 * num)
        elif val <= 5000:
            num = math.ceil((val - 1000) / 100)
            fee = 160 + (15 * num)
        elif val <= 10000:
            num = math.ceil((val - 5000) / 250)
            fee = 760 + (25 * num)
        elif val <= 20000:
            num = math.ceil((val - 10000) / 500)
            fee = 1260 + (40 * num)
        elif val <= 30000:
            num = math.ceil((val - 20000) / 1000)
            fee = 2060 + (50 * num)
        elif val <= 50000:
            num = math.ceil((val - 30000) / 2000)
            fee = 2560 + (50 * num)
        else:
            num = math.ceil((val - 50000) / 5000)
            fee = 3060 + (50 * num)

    # Gujarat
    elif st == "Gujarat":
        if val <= 10000:
            num = math.ceil(val / 1000)
            fee = 100 * num
        elif val <= 15000:
            fee = 1250
        elif val <= 20000:
            fee = 1500
        elif val <= 21000:
            fee = 1525
        elif val <= 30000:
            num = math.ceil((val - 21000) / 1000)
            fee = 1525 + (75 * num)
        elif val <= 34000:
            num = math.ceil((val - 30000) / 2000)
            fee = 2200 + (175 * num)
        elif val <= 50000:
            num = math.ceil((val - 34000) / 2000)
            fee = 2500 + (150 * num)
        elif val <= 75000:
            num = math.ceil((val - 50000) / 5000)
            fee = 3700 + (300 * num)
        elif val <= 100000:
            num = math.ceil((val - 75000) / 5000)
            fee = 5200 + (150 * num)
        elif val <= 1000000:
            num = math.ceil((val - 100000) / 10000)
            fee = 5950 + (200 * num)
        elif val <= 2000000:
            num = math.ceil((val - 1000000) / 100000)
            fee = 23950 + (1200 * num)
        else:
            num = math.ceil((val - 2000000) / 100000)
            fee = 35950 + (500 * num)
        fee = min(fee, 75000.0)

    # Karnataka
    elif st == "Karnataka":
        if val <= 15000:
            fee = val * 0.025
        elif val <= 75000:
            fee = 375 + ((val - 15000) * 0.075)
        elif val <= 250000:
            fee = 4875 + ((val - 75000) * 0.07)
        elif val <= 500000:
            fee = 17125 + ((val - 250000) * 0.065)
        elif val <= 750000:
            fee = 33375 + ((val - 500000) * 0.06)
        elif val <= 1000000:
            fee = 48375 + ((val - 750000) * 0.055)
        elif val <= 1500000:
            fee = 62125 + ((val - 1000000) * 0.05)
        elif val <= 2000000:
            fee = 87125 + ((val - 1500000) * 0.045)
        elif val <= 2500000:
            fee = 109625 + ((val - 2000000) * 0.04)
        elif val <= 3000000:
            fee = 129625 + ((val - 2500000) * 0.035)
        elif val <= 4000000:
            fee = 147125 + ((val - 3000000) * 0.03)
        elif val <= 5000000:
            fee = 177125 + ((val - 4000000) * 0.025)
        elif val <= 6000000:
            fee = 202125 + ((val - 5000000) * 0.02)
        elif val <= 7000000:
            fee = 222125 + ((val - 6000000) * 0.015)
        elif val <= 8000000:
            fee = 237125 + ((val - 7000000) * 0.01)
        else:
            fee = 247125 + ((val - 8000000) / 200)

    # Kerala
    elif st == "Kerala":
        if val <= 100:
            fee = 4.0
        elif val <= 15000:
            num = math.ceil((val - 100) / 100)
            fee = 4 + (4 * num)
        elif val <= 50000:
            num = math.ceil((val - 15000) / 100)
            fee = 600 + (8 * num)
        elif val <= 1000000:
            num = math.ceil((val - 50000) / 100)
            fee = 3400 + (10 * num)
        elif val <= 10000000:
            num = math.ceil((val - 1000000) / 100)
            fee = 98400 + (8 * num)
        else:
            num = math.ceil((val - 10000000) / 100)
            fee = 818400 + num

    # Maharashtra
    elif st == "Maharashtra":
        if val <= 1000:
            fee = 200.0
        elif val <= 5000:
            num = math.ceil((val - 1000) / 100)
            fee = 200 + (12 * num)
        elif val <= 10000:
            num = math.ceil((val - 5000) / 100)
            fee = 680 + (15 * num)
        elif val <= 20000:
            num = math.ceil((val - 10000) / 500)
            fee = 1430 + (75 * num)
        elif val <= 30000:
            num = math.ceil((val - 20000) / 1000)
            fee = 2930 + (100 * num)
        elif val <= 50000:
            num = math.ceil((val - 30000) / 2000)
            fee = 3930 + (100 * num)
        elif val <= 100000:
            num = math.ceil((val - 50000) / 5000)
            fee = 4930 + (150 * num)
        elif val <= 1100000:
            num = math.ceil((val - 100000) / 10000)
            fee = 6430 + (200 * num)
        elif val <= 23900000:
            num = math.ceil((val - 1100000) / 100000)
            fee = 26430 + (1200 * num)
        else:
            fee = 300000.0

    # Punjab
    elif st == "Punjab":
        if val <= 10000:
            fee = val * 0.025
        elif val <= 20000:
            fee = 250 + ((val - 10000) * 0.035)
        elif val <= 30000:
            fee = 600 + ((val - 20000) * 0.045)
        elif val <= 40000:
            fee = 1050 + ((val - 30000) * 0.055)
        elif val <= 50000:
            fee = 1600 + ((val - 40000) * 0.065)
        elif val <= 60000:
            fee = 2250 + ((val - 50000) * 0.075)
        elif val <= 75000:
            fee = 3000 + ((val - 60000) * 0.065)
        elif val <= 100000:
            fee = 3975 + ((val - 75000) * 0.055)
        elif val <= 200000:
            fee = 5350 + ((val - 100000) * 0.035)
        elif val <= 300000:
            fee = 8850 + ((val - 200000) * 0.0225)
        else:
            fee = 11100 + ((val - 300000) * 0.0225)

    # Rajasthan
    elif st == "Rajasthan":
        if val <= 15000:
            fee = val * 0.025
        elif val <= 75000:
            fee = 375 + ((val - 15000) * 0.075)
        elif val <= 250000:
            fee = 4875 + ((val - 75000) * 0.07)
        elif val <= 500000:
            fee = 17125 + ((val - 250000) * 0.065)
        elif val <= 750000:
            fee = 33375 + ((val - 500000) * 0.06)
        elif val <= 1000000:
            fee = 48375 + ((val - 750000) * 0.055)
        elif val <= 1500000:
            fee = 62125 + ((val - 1000000) * 0.05)
        elif val <= 2000000:
            fee = 87125 + ((val - 1500000) * 0.045)
        elif val <= 2500000:
            fee = 109625 + ((val - 2000000) * 0.04)
        elif val <= 3000000:
            fee = 129625 + ((val - 2500000) * 0.035)
        elif val <= 4000000:
            fee = 147125 + ((val - 3000000) * 0.03)
        elif val <= 10000000:
            fee = 177125 + ((val - 4000000) * 0.025)
        elif val <= 15000000:
            fee = 327125 + ((val - 10000000) * 0.02)
        elif val <= 20000000:
            fee = 427125 + ((val - 15000000) * 0.015)
        elif val <= 30000000:
            fee = 502125 + ((val - 20000000) * 0.01)
        else:
            fee = 602125 + ((val - 30000000) / 200)

    # Uttar Pradesh & Uttarakhand
    elif st in ("Uttar Pradesh", "Uttarakhand"):
        if val <= 100:
            num = math.ceil(val / 5)
            fee = 0.5 * num
        elif val <= 300:
            num = math.ceil((val - 100) / 10)
            fee = 10 + (1.25 * num)
        elif val <= 500:
            num = math.ceil((val - 300) / 10)
            fee = 35 + (1.5 * num)
        elif val <= 1000:
            num = math.ceil((val - 500) / 10)
            fee = 65 + (2.25 * num)
        elif val <= 5000:
            num = math.ceil((val - 1000) / 100)
            fee = 177.5 + (12 * num)
        elif val <= 10000:
            num = math.ceil((val - 5000) / 200)
            fee = 657.5 + (20 * num)
        else:
            num = math.ceil((val - 10000) / 500)
            fee = 1157.5 + (37.5 * num)

    # West Bengal
    elif st == "West Bengal":
        if val <= 1000:
            num = math.ceil(val / 100)
            fee = 10 * num
        elif val <= 7500:
            num = math.ceil((val - 1000) / 250)
            fee = 100 + (8 * num)
        elif val <= 10000:
            num = math.ceil((val - 7500) / 500)
            fee = 620 + (16 * num)
        elif val <= 20000:
            num = math.ceil((val - 10000) / 10)
            fee = 780 + (30 * num)
        elif val <= 50000:
            num = math.ceil((val - 20000) / 1000)
            fee = 1380 + (50 * num)
        elif val <= 100000:
            num = math.ceil((val - 50000) / 5000)
            fee = 2880 + (350 * num)
        elif val <= 200000:
            num = math.ceil((val - 100000) / 5000)
            fee = 6380 + (370 * num)
        elif val <= 300000:
            num = math.ceil((val - 200000) / 5000)
            fee = 13780 + (210 * num)
        else:
            num = math.ceil((val - 300000) / 10000)
            fee = 17980 + (100 * num)
        fee = min(fee, 50000.0)

    # Fallback default: 2.5%
    else:
        fee = round(val * 0.025, 2)

    fee_rounded = round(fee, 2)
    val_int_str = f"{int(val):,}"

    return {
        "state": st,
        "valuation": val,
        "court_fee": fee_rounded,
        "formatted": f"Ad-Valorem Court Fees for valuation of ₹{val_int_str}/- for the State of {st} is ₹{fee_rounded:,.2f}/-"
    }
