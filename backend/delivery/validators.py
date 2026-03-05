DELIVERY_STATUS_TRANSITIONS = {
    "assigned": ["picked"],
    "picked": ["onway"],
    "onway": ["delivered"],
    "delivered": []
}

VALID_DELIVERY_STATUSES = ["picked", "onway", "delivered"]


def validate_delivery_status_transition(current_status, new_status):
    """
    Validates delivery status transitions.
    
    Args:
        current_status: Current delivery status
        new_status: Requested new status
        
    Returns:
        tuple: (is_valid: bool, error_message: str or None)
    """
    if new_status not in VALID_DELIVERY_STATUSES:
        return False, f"Invalid status. Must be one of: {', '.join(VALID_DELIVERY_STATUSES)}"
    
    if current_status == "delivered":
        return False, "Cannot change status after delivery is completed"
    
    allowed_transitions = DELIVERY_STATUS_TRANSITIONS.get(current_status, [])
    if new_status not in allowed_transitions:
        return False, f"Cannot transition from '{current_status}' to '{new_status}'. Next valid status: {', '.join(allowed_transitions) if allowed_transitions else 'none'}"
    
    return True, None
