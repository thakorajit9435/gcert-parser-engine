from qdrant_client import QdrantClient
from qdrant_client.http import models
from qdrant_client.http.models import Distance, VectorParams, PayloadSchemaType
from config.settings import settings
from src.core.logger import logger

class QdrantClientHelper:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(QdrantClientHelper, cls).__new__(cls)
            if settings.QDRANT_URL:
                logger.info("Connecting to Qdrant Cloud at: %s", settings.QDRANT_URL)
                cls._instance.client = QdrantClient(
                    url=settings.QDRANT_URL,
                    api_key=settings.QDRANT_API_KEY if settings.QDRANT_API_KEY else None,
                    timeout=60.0
                )
            else:
                logger.info("Connecting to local Qdrant at %s:%s", settings.QDRANT_HOST, settings.QDRANT_PORT)
                cls._instance.client = QdrantClient(
                    host=settings.QDRANT_HOST,
                    port=settings.QDRANT_PORT,
                    timeout=60.0
                )
        return cls._instance

    def initialize_collection(self, force_recreate: bool = False) -> None:
        """Initializes the collection with HNSW index configuration and scalar quantization."""
        collection_name = settings.QDRANT_COLLECTION
        try:
            # Check if collection already exists
            collections_list = self.client.get_collections().collections
            exists = any(c.name == collection_name for c in collections_list)
            
            if exists and not force_recreate:
                logger.info("Qdrant collection '%s' already exists.", collection_name)
                return

            if exists and force_recreate:
                logger.info("Deleting existing collection '%s' for schema recreation...", collection_name)
                self.client.delete_collection(collection_name=collection_name)
            
            logger.info("Initializing Qdrant collection '%s' with dense/sparse vectors...", collection_name)
            
            # Create collection with dense vector configuration & HNSW optimization
            self.client.create_collection(
                collection_name=collection_name,
                vectors_config={
                    "dense-bge-m3": VectorParams(
                        size=1024,
                        distance=Distance.COSINE,
                        hnsw_config=models.HnswConfigDiff(
                            m=16,
                            ef_construct=100,
                            on_disk=True
                        ),
                        quantization_config=models.ScalarQuantization(
                            scalar=models.ScalarQuantizationConfig(
                                type=models.ScalarType.INT8,
                                always_ram=True
                            )
                        )
                    )
                },
                sparse_vectors_config={
                    "sparse-bge-m3": models.SparseVectorParams(
                        index=models.SparseIndexParams(
                            on_disk=True
                        )
                    )
                }
            )
            
            # Index payload properties to optimize search filters
            payload_indexes = {
                "standard": PayloadSchemaType.KEYWORD,
                "session": PayloadSchemaType.KEYWORD,
                "subject": PayloadSchemaType.KEYWORD,
                "chapter": PayloadSchemaType.KEYWORD,
                "topic": PayloadSchemaType.KEYWORD,
                "difficulty": PayloadSchemaType.KEYWORD,
                "language": PayloadSchemaType.KEYWORD,
                "isPremium": PayloadSchemaType.BOOL,
                "pageNumber": PayloadSchemaType.INTEGER
            }
            
            for field, schema_type in payload_indexes.items():
                self.client.create_payload_index(
                    collection_name=collection_name,
                    field_name=field,
                    field_schema=schema_type
                )
                logger.info("Created payload index in Qdrant for field: %s", field)
                
            logger.info("Qdrant collection '%s' initialized successfully.", collection_name)
            
        except Exception as e:
            logger.error("Failed to initialize Qdrant collection '%s': %s", collection_name, str(e))

    def get_client(self) -> QdrantClient:
        return self.client
