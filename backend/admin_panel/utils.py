import json

from .models import AdminLog


def create_admin_log(actor=None, action="", target_type="", target_id=None, details=None, admin=None):
    resolved_actor = admin or actor
    if resolved_actor is None:
        raise ValueError("create_admin_log requires an admin/actor user")

    AdminLog.objects.create(
        admin=resolved_actor,
        action=action,
        target_type=target_type,
        target_id=target_id,
        details=json.dumps(details or {}) if isinstance(details, dict) or details is None else str(details)
    )
