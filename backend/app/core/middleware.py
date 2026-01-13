from flask import request, g, jsonify
from functools import wraps
from app.core.database import session_scope
from app.services.tenant_service import TenantService

def tenant_required():
    """
    Middleware/Decorator to ensure a valid tenant is present.
    Injects `g.tenant` and `g.tenant_id`.
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            host = request.headers.get("Host", "").split(":")[0] # remove port
            
            # Allow skipping for generic domains if needed, or dev localhost
            # For dev, we might fix a default tenant if not found
            
            with session_scope() as session:
                service = TenantService(session)
                tenant = service.resolve_tenant(host)
                
                # DEV MODE FALLBACK: If typical localhost and no tenant, assume ID 1
                if not tenant and (host == "localhost" or host == "127.0.0.1"):
                     tenant = service.repository.get(1)
                
                if not tenant:
                    return jsonify({"error": "Inquilino não identificado ou inválido"}), 404
                
                if not tenant.is_active:
                     return jsonify({"error": "Acesso desativado para esta instituição"}), 403

                # Store in Flask GLOBAL g
                g.tenant = tenant
                g.tenant_id = tenant.id
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator
