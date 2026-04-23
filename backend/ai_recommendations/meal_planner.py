import math
import pulp

MEAL_SLOTS = ["breakfast", "lunch", "dinner"]
DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


def _haversine(lat1, lng1, lat2, lng2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlng / 2) ** 2
    )
    return R * 2 * math.asin(math.sqrt(a))


def _get_nearby_restaurants(hostel_lat, hostel_lng, radius_km=5.0):
    from restaurant.models import Restaurant

    nearby = []
    qs = (
        Restaurant.objects.filter(is_approved=True)
        .exclude(latitude=None)
        .exclude(longitude=None)
    )

    for r in qs:
        rid = r.restaurant_id or str(r.id)
        dist = _haversine(hostel_lat, hostel_lng, float(r.latitude), float(r.longitude))
        if dist <= radius_km:
            nearby.append(
                {
                    "restaurant_id": rid,
                    "restaurant_name": r.name,
                    "area": r.area,
                    "latitude": float(r.latitude),
                    "longitude": float(r.longitude),
                    "distance_km": round(dist, 2),
                    "db_id": r.id,
                }
            )

    return nearby


def _get_food_items(nearby, veg_only=False):
    from restaurant.models import FoodItem

    db_id_to_rid = {r["db_id"]: r["restaurant_id"] for r in nearby}

    qs = FoodItem.objects.filter(
        restaurant_id__in=db_id_to_rid.keys(),
        is_available=True,
        meal_type__in=MEAL_SLOTS,
        veg_nonveg__in=["Veg", "NonVeg"],
    )

    if veg_only:
        qs = qs.filter(veg_nonveg="Veg")

    items = []
    for item in qs:
        items.append(
            {
                "food_id": item.food_id or str(item.id),
                "food_item": item.name,
                "restaurant_id": db_id_to_rid[item.restaurant_id],
                "meal_type": item.meal_type,
                "veg_nonveg": item.veg_nonveg,
                "price_lkr": int(round(float(item.price))),
            }
        )
    return items


def _build_plan_table(solution_vars, food_items, nearby_map):
    plan = []
    food_lookup = {f["food_id"]: f for f in food_items}

    for (day, slot, food_id), var in solution_vars.items():
        if pulp.value(var) == 1:
            food = food_lookup[food_id]
            rest = nearby_map[food["restaurant_id"]]
            plan.append(
                {
                    "day": day,
                    "meal_slot": slot,
                    "food_item": food["food_item"],
                    "restaurant_name": rest["restaurant_name"],
                    "restaurant_id": food["restaurant_id"],
                    "area": rest["area"],
                    "distance_km": rest["distance_km"],
                    "veg_nonveg": food["veg_nonveg"],
                    "price_lkr": food["price_lkr"],
                }
            )

    day_order = {d: i for i, d in enumerate(DAYS)}
    slot_order = {s: i for i, s in enumerate(MEAL_SLOTS)}
    plan.sort(key=lambda x: (day_order[x["day"]], slot_order[x["meal_slot"]]))
    return plan


def _summarize_plan(plan, weekly_budget, radius_km, veg_only, plan_type):
    total_cost = sum(row["price_lkr"] for row in plan)
    daily_costs = {}
    daily_meals = {day: [] for day in DAYS}

    for row in plan:
        daily_costs[row["day"]] = daily_costs.get(row["day"], 0) + row["price_lkr"]
        daily_meals[row["day"]].append(row["meal_slot"])

    days_with_missing = {}
    for day in DAYS:
        missing = [slot for slot in MEAL_SLOTS if slot not in daily_meals[day]]
        if missing:
            days_with_missing[day] = missing

    return {
        "weekly_food_budget_lkr": weekly_budget,
        "weekly_total_cost_lkr": total_cost,
        "weekly_remaining_lkr": weekly_budget - total_cost,
        "daily_average_lkr": round(total_cost / 7) if plan else 0,
        "meals_planned": len(plan),
        "restaurants_used": len({r["restaurant_id"] for r in plan}),
        "daily_costs": daily_costs,
        "days_with_missing_meals": days_with_missing,
        "veg_only": veg_only,
        "search_radius_km": radius_km,
        "plan_type": plan_type,
    }


def _build_full_plan_model(food_items, weekly_budget=None):
    prob = pulp.LpProblem("FullMealPlan", pulp.LpMinimize)
    x = {}

    for day in DAYS:
        for slot in MEAL_SLOTS:
            slot_items = [f for f in food_items if f["meal_type"] == slot]
            for item in slot_items:
                fid = item["food_id"]
                x[(day, slot, fid)] = pulp.LpVariable(f"x_{day}_{slot}_{fid}", cat="Binary")

    price_of = {f["food_id"]: f["price_lkr"] for f in food_items}

    prob += pulp.lpSum(price_of[fid] * var for (_, _, fid), var in x.items())

    for day in DAYS:
        for slot in MEAL_SLOTS:
            slot_vars = [v for (d, s, _), v in x.items() if d == day and s == slot]
            if not slot_vars:
                return None, None, None
            prob += pulp.lpSum(slot_vars) == 1

    if weekly_budget is not None:
        prob += pulp.lpSum(price_of[fid] * var for (_, _, fid), var in x.items()) <= weekly_budget

    all_fids = {fid for (_, _, fid) in x}
    for fid in all_fids:
        item_vars = [v for (_, _, f), v in x.items() if f == fid]
        if item_vars:
            prob += pulp.lpSum(item_vars) <= 3

    nearby_rest_ids = {f["restaurant_id"] for f in food_items}
    for day in DAYS:
        for rest_id in nearby_rest_ids:
            rest_fids = {f["food_id"] for f in food_items if f["restaurant_id"] == rest_id}
            rest_vars = [v for (d, _, f), v in x.items() if d == day and f in rest_fids]
            if rest_vars:
                prob += pulp.lpSum(rest_vars) <= 2

    return prob, x, price_of


def _build_partial_plan_model(food_items, weekly_budget):
    """
    Partial plan:
    - maximize number of meals under budget
    - keep at least 1 meal per day
    - at most 1 item per slot per day
    """
    prob = pulp.LpProblem("PartialMealPlan", pulp.LpMaximize)
    x = {}

    for day in DAYS:
        for slot in MEAL_SLOTS:
            slot_items = [f for f in food_items if f["meal_type"] == slot]
            for item in slot_items:
                fid = item["food_id"]
                x[(day, slot, fid)] = pulp.LpVariable(f"x_{day}_{slot}_{fid}", cat="Binary")

    price_of = {f["food_id"]: f["price_lkr"] for f in food_items}

    # maximize number of meals first, then cheaper cost second
    prob += (
        1000 * pulp.lpSum(var for var in x.values())
        - pulp.lpSum(price_of[fid] * var for (_, _, fid), var in x.items())
    )

    for day in DAYS:
        day_vars = [v for (d, _, _), v in x.items() if d == day]
        if not day_vars:
            return None, None, None

        # at least 1 meal per day
        prob += pulp.lpSum(day_vars) >= 1

        for slot in MEAL_SLOTS:
            slot_vars = [v for (d, s, _), v in x.items() if d == day and s == slot]
            if slot_vars:
                prob += pulp.lpSum(slot_vars) <= 1

    prob += pulp.lpSum(price_of[fid] * var for (_, _, fid), var in x.items()) <= weekly_budget

    all_fids = {fid for (_, _, fid) in x}
    for fid in all_fids:
        item_vars = [v for (_, _, f), v in x.items() if f == fid]
        if item_vars:
            prob += pulp.lpSum(item_vars) <= 3

    nearby_rest_ids = {f["restaurant_id"] for f in food_items}
    for day in DAYS:
        for rest_id in nearby_rest_ids:
            rest_fids = {f["food_id"] for f in food_items if f["restaurant_id"] == rest_id}
            rest_vars = [v for (d, _, f), v in x.items() if d == day and f in rest_fids]
            if rest_vars:
                prob += pulp.lpSum(rest_vars) <= 2

    return prob, x, price_of


def generate_meal_plan(
    hostel_lat,
    hostel_lng,
    hostel_area,
    monthly_total_budget,
    selected_room_rent,
    veg_only=False,
    radius_km=5.0,
    allow_partial=False,
):
    """
    monthly_total_budget: student's total monthly budget
    selected_room_rent: chosen room monthly rent
    allow_partial=False:
        if full plan not affordable, return confirmation response
    allow_partial=True:
        generate partial weekly meal plan covering every day
    """

    # 1) monthly -> weekly food budget
    monthly_food_budget = monthly_total_budget - selected_room_rent
    weekly_food_budget = int(monthly_food_budget / 4)

    if monthly_food_budget <= 0 or weekly_food_budget <= 0:
        return {
            "status": "error",
            "message": "Your budget is not enough after subtracting room rent.",
            "summary": {
                "monthly_total_budget": monthly_total_budget,
                "selected_room_rent": selected_room_rent,
                "monthly_food_budget_lkr": max(0, monthly_food_budget),
                "weekly_food_budget_lkr": max(0, weekly_food_budget),
            },
        }

    # 2) nearby restaurants with increased default radius
    nearby = _get_nearby_restaurants(hostel_lat, hostel_lng, radius_km)
    if len(nearby) < 5:
        nearby = _get_nearby_restaurants(hostel_lat, hostel_lng, radius_km * 1.5)
        radius_km = radius_km * 1.5
    if len(nearby) < 5:
        nearby = _get_nearby_restaurants(hostel_lat, hostel_lng, radius_km * 1.5)
        radius_km = radius_km * 1.5

    if not nearby:
        return {
            "status": "error",
            "message": "No nearby restaurants found for the selected room.",
        }

    nearby_map = {r["restaurant_id"]: r for r in nearby}
    food_items = _get_food_items(nearby, veg_only=veg_only)

    if not food_items:
        return {
            "status": "error",
            "message": "No food items available from nearby restaurants.",
        }

    for slot in MEAL_SLOTS:
        if not any(f["meal_type"] == slot for f in food_items):
            return {
                "status": "error",
                "message": f"No {slot} items are available nearby.",
            }

    # 3) find cheapest possible FULL weekly plan first
    full_min_prob, full_min_x, _ = _build_full_plan_model(food_items, weekly_budget=None)
    if full_min_prob is None:
        return {
            "status": "error",
            "message": "Could not build a valid weekly meal plan from the available restaurant data.",
        }

    solver = pulp.PULP_CBC_CMD(msg=False)
    full_min_prob.solve(solver)

    if pulp.LpStatus[full_min_prob.status] != "Optimal":
        return {
            "status": "error",
            "message": "Could not build a valid weekly meal plan from the available restaurant data.",
        }

    cheapest_full_weekly_cost = int(round(pulp.value(full_min_prob.objective)))

    # 4) if full weekly plan is affordable -> generate it
    if weekly_food_budget >= cheapest_full_weekly_cost:
        full_budget_prob, full_budget_x, _ = _build_full_plan_model(
            food_items, weekly_budget=weekly_food_budget
        )
        full_budget_prob.solve(solver)

        if pulp.LpStatus[full_budget_prob.status] != "Optimal":
            return {
                "status": "error",
                "message": "A full weekly meal plan could not be generated within your budget.",
            }

        plan = _build_plan_table(full_budget_x, food_items, nearby_map)
        summary = _summarize_plan(
            plan=plan,
            weekly_budget=weekly_food_budget,
            radius_km=radius_km,
            veg_only=veg_only,
            plan_type="full",
        )
        summary.update(
            {
                "monthly_total_budget_lkr": monthly_total_budget,
                "selected_room_rent_lkr": selected_room_rent,
                "monthly_food_budget_lkr": monthly_food_budget,
            }
        )

        return {
            "status": "success",
            "message": "Full weekly meal plan generated successfully.",
            "plan": plan,
            "summary": summary,
        }

    # 5) if full plan is NOT affordable, check whether at least a basic partial plan is possible
    cheapest_per_day = []
    for day in DAYS:
        cheapest_day = None
        for slot in MEAL_SLOTS:
            slot_prices = [f["price_lkr"] for f in food_items if f["meal_type"] == slot]
            if slot_prices:
                cheapest_slot = min(slot_prices)
                if cheapest_day is None or cheapest_slot < cheapest_day:
                    cheapest_day = cheapest_slot
        if cheapest_day is None:
            return {
                "status": "error",
                "message": "Your budget is not enough because nearby restaurants do not have enough meal options.",
            }
        cheapest_per_day.append(cheapest_day)

    minimum_basic_weekly_cost = sum(cheapest_per_day)

    if weekly_food_budget < minimum_basic_weekly_cost:
        return {
            "status": "error",
            "message": "Your budget is not enough to generate even a basic weekly meal plan.",
            "summary": {
                "monthly_total_budget_lkr": monthly_total_budget,
                "selected_room_rent_lkr": selected_room_rent,
                "monthly_food_budget_lkr": monthly_food_budget,
                "weekly_food_budget_lkr": weekly_food_budget,
                "minimum_basic_weekly_cost_lkr": minimum_basic_weekly_cost,
                "minimum_full_weekly_cost_lkr": cheapest_full_weekly_cost,
            },
        }

    # user has enough for partial, but not enough for full
    if not allow_partial:
        return {
            "status": "needs_confirmation",
            "message": (
                "Your weekly food budget is not enough for a full 7-day meal plan "
                "with Breakfast, Lunch, and Dinner every day. "
                "Would you like to generate a partial meal plan that still covers every day?"
            ),
            "summary": {
                "monthly_total_budget_lkr": monthly_total_budget,
                "selected_room_rent_lkr": selected_room_rent,
                "monthly_food_budget_lkr": monthly_food_budget,
                "weekly_food_budget_lkr": weekly_food_budget,
                "minimum_full_weekly_cost_lkr": cheapest_full_weekly_cost,
                "minimum_basic_weekly_cost_lkr": minimum_basic_weekly_cost,
                "shortfall_for_full_plan_lkr": cheapest_full_weekly_cost - weekly_food_budget,
            },
        }

    # 6) generate partial plan if user confirmed
    partial_prob, partial_x, _ = _build_partial_plan_model(food_items, weekly_food_budget)
    if partial_prob is None:
        return {
            "status": "error",
            "message": "Could not generate a partial meal plan.",
        }

    partial_prob.solve(solver)

    if pulp.LpStatus[partial_prob.status] != "Optimal":
        return {
            "status": "error",
            "message": "Could not generate a partial meal plan within your budget.",
        }

    plan = _build_plan_table(partial_x, food_items, nearby_map)
    summary = _summarize_plan(
        plan=plan,
        weekly_budget=weekly_food_budget,
        radius_km=radius_km,
        veg_only=veg_only,
        plan_type="partial",
    )
    summary.update(
        {
            "monthly_total_budget_lkr": monthly_total_budget,
            "selected_room_rent_lkr": selected_room_rent,
            "monthly_food_budget_lkr": monthly_food_budget,
            "minimum_full_weekly_cost_lkr": cheapest_full_weekly_cost,
            "minimum_basic_weekly_cost_lkr": minimum_basic_weekly_cost,
        }
    )

    return {
        "status": "success",
        "message": "Partial weekly meal plan generated successfully.",
        "plan": plan,
        "summary": summary,
    }