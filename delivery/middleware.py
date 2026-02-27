import time
from delivery.models import ApiRequestLog


class ApiRequestLogMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start_time = time.time()
        
        response = self.get_response(request)
        
        execution_time = time.time() - start_time
        
        user = request.user if request.user.is_authenticated else None
        
        ApiRequestLog.objects.create(
            path=request.path,
            method=request.method,
            user=user,
            status_code=response.status_code,
            execution_time=execution_time
        )
        
        return response
