"""Object storage resource for immutable raw-source snapshots."""

from dataclasses import dataclass
from datetime import UTC, datetime

from minio import Minio

from groceryview_data_pipeline.resources.settings import PipelineSettings, get_settings
from groceryview_data_pipeline.scrapers.base import snapshot_hash


@dataclass(frozen=True)
class StoredSnapshot:
    uri: str
    sha256: str
    content_type: str
    stored_at: datetime


class ObjectStorageResource:
    """MinIO/S3-compatible writer for raw JSON/HTML snapshots before parsing."""

    def __init__(self, settings: PipelineSettings | None = None) -> None:
        self.settings = settings or get_settings()
        endpoint = self.settings.object_storage_endpoint.removeprefix("http://").removeprefix(
            "https://"
        )
        secure = self.settings.object_storage_endpoint.startswith("https://")
        self._client = Minio(endpoint, secure=secure)

    @property
    def bucket(self) -> str:
        return self.settings.object_storage_bucket

    @property
    def client(self) -> Minio:
        return self._client

    def put_bytes(self, *, key: str, payload: bytes, content_type: str) -> StoredSnapshot:
        """Write an immutable snapshot if storage credentials are configured."""

        # The actual write is intentionally deferred until local infrastructure/credentials exist.
        # This scaffold computes the canonical URI/hash and gives later code one place to enable IO.
        digest = snapshot_hash(payload)
        return StoredSnapshot(
            uri=f"s3://{self.bucket}/{key}",
            sha256=digest,
            content_type=content_type,
            stored_at=datetime.now(tz=UTC),
        )


def build_object_storage_resource() -> ObjectStorageResource:
    return ObjectStorageResource()
