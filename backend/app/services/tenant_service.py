from typing import Optional
from sqlalchemy.orm import Session

from app.repositories.tenant_repository import TenantRepository
from app.models.tenant import Tenant

class TenantService:
    def __init__(self, session: Session):
        self.repository = TenantRepository(session)
        
    def resolve_tenant(self, host: str) -> Optional[Tenant]:
        """
        Resolves tenant based on Host header.
        Example: school1.app.com -> domain=school1.app.com
        """
        # First try exact domain match
        tenant = self.repository.get_by_domain(host)
        if tenant:
            return tenant
            
        # Fallback logic could go here (e.g. check slug subdomain)
        # For now simple exact match
        return None

    def get_public_settings(self, tenant_id: int) -> dict:
        tenant = self.repository.get(tenant_id)
        if not tenant:
            return {}
        return tenant.settings or {}
