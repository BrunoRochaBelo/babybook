"""
MinIO Storage Provider

MinIO é usado para desenvolvimento local, simulando S3/R2.

Em docker-compose.yml, o MinIO está configurado em:
- Endpoint: http://localhost:9000
- Console: http://localhost:9001
- Credentials: minioadmin/minioadmin (dev)
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from babybook_api.storage.base import (
    StorageProvider,
    StorageConfig,
    ObjectInfo,
    PresignedUrlResult,
    UploadPartInfo,
)

try:
    import aioboto3
    from botocore.config import Config as BotoConfig
except ImportError:
    aioboto3 = None  # type: ignore
    BotoConfig = None  # type: ignore


class MinIOProvider(StorageProvider):
    """
    Provider para MinIO (desenvolvimento local).
    
    Configuração típica:
    - endpoint_url: http://localhost:9000
    - access_key_id: minioadmin
    - secret_access_key: minioadmin
    - bucket: babybook-dev
    """
    
    @property
    def provider_name(self) -> str:
        return "minio"
    
    async def initialize(self) -> None:
        if aioboto3 is None:
            raise ImportError("aioboto3 é necessário para MinIOProvider. Instale com: pip install aioboto3")
        
        self._session = aioboto3.Session()
        
        boto_config = BotoConfig(
            signature_version="s3v4",
            s3={
                "addressing_style": "path",
            },
        )
        
        self._client_context = self._session.client(
            "s3",
            endpoint_url=self.config.endpoint_url or "http://localhost:9000",
            aws_access_key_id=self.config.access_key_id or "minioadmin",
            aws_secret_access_key=self.config.secret_access_key or "minioadmin",
            region_name=self.config.region or "us-east-1",
            config=boto_config,
        )
        self._client = await self._client_context.__aenter__()
        
        # Garantir que o bucket existe
        await self._ensure_bucket_exists()
    
    async def _ensure_bucket_exists(self) -> None:
        """Cria o bucket se não existir (útil para dev)"""
        try:
            await self._client.head_bucket(Bucket=self.config.bucket)
        except Exception:
            try:
                await self._client.create_bucket(Bucket=self.config.bucket)
            except Exception:
                pass  # Bucket pode já existir
    
    async def close(self) -> None:
        if self._client_context:
            await self._client_context.__aexit__(None, None, None)
            self._client = None
    
    async def get_object(self, key: str) -> bytes:
        response = await self._client.get_object(Bucket=self.config.bucket, Key=key)
        async with response["Body"] as stream:
            return await stream.read()
    
    async def get_object_info(self, key: str) -> ObjectInfo | None:
        try:
            response = await self._client.head_object(Bucket=self.config.bucket, Key=key)
            return ObjectInfo(
                key=key,
                size=response.get("ContentLength", 0),
                etag=response.get("ETag", "").strip('"'),
                content_type=response.get("ContentType"),
                last_modified=response.get("LastModified"),
                metadata=response.get("Metadata", {}),
            )
        except Exception:
            return None
    
    async def object_exists(self, key: str) -> bool:
        return await self.get_object_info(key) is not None
    
    async def list_objects(
        self,
        prefix: str,
        max_keys: int = 1000,
        continuation_token: str | None = None,
    ) -> tuple[list[ObjectInfo], str | None]:
        params: dict[str, Any] = {
            "Bucket": self.config.bucket,
            "Prefix": prefix,
            "MaxKeys": max_keys,
        }
        if continuation_token:
            params["ContinuationToken"] = continuation_token
        
        response = await self._client.list_objects_v2(**params)
        
        objects = [
            ObjectInfo(
                key=obj["Key"],
                size=obj["Size"],
                etag=obj.get("ETag", "").strip('"'),
                last_modified=obj.get("LastModified"),
            )
            for obj in response.get("Contents", [])
        ]
        
        next_token = response.get("NextContinuationToken")
        return objects, next_token
    
    async def put_object(
        self,
        key: str,
        data: bytes,
        content_type: str | None = None,
        metadata: dict[str, str] | None = None,
    ) -> ObjectInfo:
        params: dict[str, Any] = {
            "Bucket": self.config.bucket,
            "Key": key,
            "Body": data,
        }
        if content_type:
            params["ContentType"] = content_type
        if metadata:
            params["Metadata"] = metadata
        
        response = await self._client.put_object(**params)
        
        return ObjectInfo(
            key=key,
            size=len(data),
            etag=response.get("ETag", "").strip('"'),
            content_type=content_type,
            last_modified=datetime.now(timezone.utc),
            metadata=metadata or {},
        )
    
    async def delete_object(self, key: str) -> bool:
        try:
            await self._client.delete_object(Bucket=self.config.bucket, Key=key)
            return True
        except Exception:
            return False
    
    async def delete_objects(self, keys: list[str]) -> list[str]:
        if not keys:
            return []
        
        response = await self._client.delete_objects(
            Bucket=self.config.bucket,
            Delete={"Objects": [{"Key": k} for k in keys]},
        )
        
        errors = [e["Key"] for e in response.get("Errors", [])]
        return errors
    
    async def copy_object(
        self,
        source_key: str,
        dest_key: str,
        dest_bucket: str | None = None,
    ) -> ObjectInfo:
        copy_source = {"Bucket": self.config.bucket, "Key": source_key}
        target_bucket = dest_bucket or self.config.bucket
        
        await self._client.copy_object(
            Bucket=target_bucket,
            Key=dest_key,
            CopySource=copy_source,
        )
        
        info = await self.get_object_info(dest_key)
        return info or ObjectInfo(key=dest_key, size=0)
    
    async def generate_presigned_get_url(
        self,
        key: str,
        expires_in: timedelta = timedelta(hours=1),
        response_content_type: str | None = None,
        response_content_disposition: str | None = None,
    ) -> PresignedUrlResult:
        params: dict[str, Any] = {
            "Bucket": self.config.bucket,
            "Key": key,
        }
        if response_content_type:
            params["ResponseContentType"] = response_content_type
        if response_content_disposition:
            params["ResponseContentDisposition"] = response_content_disposition
        
        url = await self._client.generate_presigned_url(
            "get_object",
            Params=params,
            ExpiresIn=int(expires_in.total_seconds()),
        )
        
        return PresignedUrlResult(
            url=url,
            method="GET",
            expires_at=datetime.now(timezone.utc) + expires_in,
        )
    
    async def generate_presigned_put_url(
        self,
        key: str,
        expires_in: timedelta = timedelta(hours=1),
        content_type: str | None = None,
        content_length_range: tuple[int, int] | None = None,
        metadata: dict[str, str] | None = None,
    ) -> PresignedUrlResult:
        params: dict[str, Any] = {
            "Bucket": self.config.bucket,
            "Key": key,
        }
        if content_type:
            params["ContentType"] = content_type
        if metadata:
            params["Metadata"] = metadata
        
        url = await self._client.generate_presigned_url(
            "put_object",
            Params=params,
            ExpiresIn=int(expires_in.total_seconds()),
        )
        
        headers: dict[str, str] = {}
        if content_type:
            headers["Content-Type"] = content_type
        
        return PresignedUrlResult(
            url=url,
            method="PUT",
            expires_at=datetime.now(timezone.utc) + expires_in,
            headers=headers,
        )
    
    async def create_multipart_upload(
        self,
        key: str,
        content_type: str | None = None,
        metadata: dict[str, str] | None = None,
    ) -> str:
        params: dict[str, Any] = {
            "Bucket": self.config.bucket,
            "Key": key,
        }
        if content_type:
            params["ContentType"] = content_type
        if metadata:
            params["Metadata"] = metadata
        
        response = await self._client.create_multipart_upload(**params)
        return response["UploadId"]
    
    async def generate_presigned_part_urls(
        self,
        key: str,
        upload_id: str,
        part_count: int,
        expires_in: timedelta = timedelta(hours=1),
    ) -> list[UploadPartInfo]:
        parts = []
        for part_number in range(1, part_count + 1):
            url = await self._client.generate_presigned_url(
                "upload_part",
                Params={
                    "Bucket": self.config.bucket,
                    "Key": key,
                    "UploadId": upload_id,
                    "PartNumber": part_number,
                },
                ExpiresIn=int(expires_in.total_seconds()),
            )
            parts.append(UploadPartInfo(part_number=part_number, url=url))
        return parts
    
    async def complete_multipart_upload(
        self,
        key: str,
        upload_id: str,
        parts: list[dict[str, Any]],
    ) -> ObjectInfo:
        response = await self._client.complete_multipart_upload(
            Bucket=self.config.bucket,
            Key=key,
            UploadId=upload_id,
            MultipartUpload={"Parts": parts},
        )
        
        info = await self.get_object_info(key)
        return info or ObjectInfo(key=key, size=0, etag=response.get("ETag", "").strip('"'))
    
    async def abort_multipart_upload(self, key: str, upload_id: str) -> None:
        await self._client.abort_multipart_upload(
            Bucket=self.config.bucket,
            Key=key,
            UploadId=upload_id,
        )
