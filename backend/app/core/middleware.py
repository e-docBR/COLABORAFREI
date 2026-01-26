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

                # Resolve Academic Year from header or default current
                year_id = request.headers.get("X-Academic-Year-ID")
                if year_id and year_id.isdigit():
                    g.academic_year_id = int(year_id)
                else:
                    # Logic to find the current active academic year for this tenant
                    from app.models.academic_year import AcademicYear
                    current_year = session.query(AcademicYear).filter(
                        AcademicYear.tenant_id == tenant.id,
                        AcademicYear.is_current == True
                    ).first()
                    if current_year:
                        g.academic_year_id = current_year.id
                    else:
                        g.academic_year_id = None
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator
