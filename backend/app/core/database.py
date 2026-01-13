from contextlib import contextmanager
from flask import g
from sqlalchemy import create_engine, event
from sqlalchemy.orm import scoped_session, sessionmaker, Session
from sqlalchemy.orm.query import Query
from sqlalchemy.ext.declarative import declarative_base

from .config import settings

# 1. Base Query Class with Multi-tenant filtering
class TenantQuery(Query):
    def __new__(cls, *args, **kwargs):
        obj = super(TenantQuery, cls).__new__(cls)
        return obj

    def __init__(self, entities, session=None):
        super().__init__(entities, session)
        
    def _get_current_tenant_id(self):
        # Safely try to get tenant_id from Flask global 'g'
        try:
            return g.tenant_id
        except (RuntimeError, AttributeError):
            return None

    def enable_assertions(self, value):
        # Helper to disable filter if needed (internal use)
        self._filter_enabled = value
        return self

# 2. Event listener to inject filter
# Using 'before_compile' event is powerful but complex with caching.
# A simpler approach is to modify the get_all/filter methods in Repositories or use a Session event.
# However, 'do_orm_execute' in SQLAlchemy 1.4+ is the modern way.

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@event.listens_for(SessionLocal, "do_orm_execute")
def receive_do_orm_execute(orm_execute_state):
    # This hook runs for every ORM query execution
    
    # 1. Check if we are in a request context with a tenant
    try:
        current_tenant = g.tenant_id
    except (RuntimeError, AttributeError):
        current_tenant = None

    if current_tenant is None:
        return
        
    # 2. Check if the model being queried has 'tenant_id'
    # 'mappers' is a dictionary of mappers involved in the query
    if not orm_execute_state.is_select:
        return

    # Add filter criteria
    # This is a broad stroke: if the primary entity has tenant_id, filter it.
    
    # Preventing infinite recursion or double filtering is handled by opt-out options if needed
    if orm_execute_state.execution_options.get("include_all_tenants", False):
         return

    mapper = orm_execute_state.bind_mapper
    if mapper and hasattr(mapper.class_, "tenant_id"):
        # Append WHERE tenant_id = X
        orm_execute_state.statement = orm_execute_state.statement.where(
            mapper.class_.tenant_id == current_tenant
        )

Base = declarative_base()

def init_db(app):
    """
    Initializes the database.
    """
    # Import all models to ensure they are registered
    from .. import models  # noqa
    
    with app.app_context():
        # In dev with SQLite, we might just create all if not migrations
        # Base.metadata.create_all(bind=engine)
        pass

@contextmanager
def session_scope():
    """Provide a transactional scope around a series of operations."""
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
