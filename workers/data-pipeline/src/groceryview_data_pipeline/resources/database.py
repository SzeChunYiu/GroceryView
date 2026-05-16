"""Database resource for PostgreSQL access."""

from collections.abc import Iterator
from contextlib import contextmanager

from sqlalchemy import Engine, create_engine, text
from sqlalchemy.engine import Connection

from groceryview_data_pipeline.resources.settings import PipelineSettings, get_settings


class DatabaseResource:
    """Lazy SQLAlchemy engine wrapper for the GroceryView PostgreSQL database."""

    def __init__(self, settings: PipelineSettings | None = None) -> None:
        self.settings = settings or get_settings()
        self._engine: Engine | None = None

    @property
    def engine(self) -> Engine:
        if self._engine is None:
            self._engine = create_engine(self.settings.database_url, pool_pre_ping=True)
        return self._engine

    @contextmanager
    def connect(self) -> Iterator[Connection]:
        with self.engine.begin() as connection:
            yield connection

    def healthcheck(self) -> bool:
        with self.connect() as connection:
            connection.execute(text("select 1"))
        return True


def build_database_resource() -> DatabaseResource:
    return DatabaseResource()
