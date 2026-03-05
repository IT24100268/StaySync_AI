from rest_framework.response import Response


def api_response(success=True, message="", data=None, errors=None, meta=None, status=200):
    """
    Standard API response format
    
    Args:
        success: Boolean indicating success/failure
        message: Short message describing the result
        data: Response data (object or list)
        errors: Error details (dict or list)
        meta: Optional metadata (pagination, counts, etc.)
        status: HTTP status code
    """
    response_data = {
        "success": success,
        "message": message,
        "data": data if success else None
    }
    
    if success and meta:
        response_data["meta"] = meta
    
    if not success:
        response_data["errors"] = errors
    
    return Response(response_data, status=status)
