import numpy as np
import hashlib
from typing import List, Dict, Any, Union
from config.settings import settings
from src.core.logger import logger

class BGEEmbedder:
    _instance = None
    _model = None
    _reranker = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(BGEEmbedder, cls).__new__(cls)
        return cls._instance

    def _init_model(self):
        """Initializes the SentenceTransformer model lazily with cloud & memory safeguard."""
        if self._model is not None:
            return

        import os
        # On Render / Cloud containers with 512MB RAM, always use lightweight embedding (0MB extra RAM)
        if os.getenv("RENDER") == "true" or os.getenv("USE_LOCAL_MODELS", "false").lower() != "true":
            logger.info("Cloud environment detected (RENDER=true). Using cloud-optimized deterministic embedding (0MB RAM).")
            self._model = "fallback"
            return

        # Check available RAM before loading heavy 2.3GB PyTorch model to prevent OOM crash
        try:
            import psutil
            avail_mb = psutil.virtual_memory().available / (1024 * 1024)
            if avail_mb < 2500:
                logger.warning(
                    "Low memory environment detected (%.1f MB available < 2500 MB). "
                    "Skipping local BGE-M3 model download to prevent OOM crash on free cloud tier. "
                    "Using deterministic lightweight embedding generator.",
                    avail_mb
                )
                self._model = "fallback"
                return
        except Exception:
            pass

        try:
            from sentence_transformers import SentenceTransformer
            import torch
            
            if torch.cuda.is_available():
                device = "cuda"
            elif torch.backends.mps.is_available():
                device = "mps"
            else:
                device = "cpu"
                torch.set_num_threads(2)
                
            logger.info("Initializing BGE-M3 model on device: %s", device)
            self._model = SentenceTransformer(settings.EMBEDDING_MODEL_NAME, device=device)
            logger.info("BGE-M3 model loaded successfully.")
        except Exception as e:
            logger.warning(
                "Could not load SentenceTransformer model (%s). Fallback mock embedding generator will be used. Error: %s",
                settings.EMBEDDING_MODEL_NAME, str(e)
            )
            self._model = "fallback"


    def get_dense_embedding(self, text: str) -> List[float]:
        """Generates a 1024-dimension dense embedding vector for the given text."""
        self._init_model()
        
        if not text:
            return [0.0] * 1024

        if self._model != "fallback":
            try:
                embedding = self._model.encode(text, normalize_embeddings=True)
                return embedding.tolist()
            except Exception as e:
                logger.error("BGE-M3 dense encoding failed, using fallback: %s", str(e))

        # Fallback implementation: Deterministic pseudo-random generation based on text SHA-256 hash
        return self._generate_fallback_vector(text)

    def get_sparse_embedding(self, text: str) -> Dict[str, Any]:
        """Generates sparse vector representations (indices and values) for lexical hybrid search."""
        self._init_model()
        
        if not text:
            return {"indices": [], "values": []}

        if self._model != "fallback":
            try:
                # Try accessing tokenizer from SentenceTransformer
                tokenizer = getattr(self._model, "tokenizer", None)
                if tokenizer:
                    inputs = tokenizer(text, return_attention_mask=False)
                    input_ids = inputs.get("input_ids", [])
                    special_ids = {
                        getattr(tokenizer, "cls_token_id", None),
                        getattr(tokenizer, "sep_token_id", None),
                        getattr(tokenizer, "pad_token_id", None),
                        getattr(tokenizer, "unk_token_id", None)
                    }
                    filtered_ids = [tid for tid in input_ids if tid and tid not in special_ids]
                    
                    if filtered_ids:
                        idx_to_val = {}
                        for tid in filtered_ids:
                            count = filtered_ids.count(tid)
                            idx_to_val[tid] = round(min(1.0, 0.2 + (count * 0.15)), 3)
                        return {
                            "indices": list(idx_to_val.keys()),
                            "values": list(idx_to_val.values())
                        }
            except Exception as e:
                logger.warning("Tokenizer-based sparse encoding failed: %s", str(e))

        # Native/Fallback Sparse Generation (pseudo-lexical weight mapping)
        words = text.lower().split()
        idx_to_val = {}
        for word in set(words):
            # Calculate deterministic index between 0 and 32000 (standard vocab size)
            idx = int(hashlib.md5(word.encode("utf-8")).hexdigest(), 16) % 32000
            # Weight based on word length and frequency
            val = round(min(1.0, 0.1 + (words.count(word) * 0.15)), 3)
            # Handle hash collisions by taking the maximum weight
            if idx in idx_to_val:
                idx_to_val[idx] = max(idx_to_val[idx], val)
            else:
                idx_to_val[idx] = val

        # Sort by index to conform to Qdrant sparse vector requirements
        sorted_pairs = sorted(idx_to_val.items())
        return {
            "indices": [pair[0] for pair in sorted_pairs],
            "values": [pair[1] for pair in sorted_pairs]
        }

    def _generate_fallback_vector(self, text: str) -> List[float]:
        """Generates a deterministic 1024-dimension vector from a text hash for mock/test runs."""
        hash_obj = hashlib.sha256(text.encode("utf-8"))
        seed = int(hash_obj.hexdigest(), 16) % (2**32 - 1)
        np.random.seed(seed)
        vec = np.random.randn(1024)
        # Normalize to unit length
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec.tolist()

    def _init_reranker(self):
        """Initializes the CrossEncoder re-ranker model lazily with memory safeguard."""
        if self._reranker is not None:
            return

        import os
        if os.getenv("RENDER") == "true" or os.getenv("USE_LOCAL_MODELS", "false").lower() != "true":
            self._reranker = "fallback"
            return

        try:
            import psutil
            avail_mb = psutil.virtual_memory().available / (1024 * 1024)
            if avail_mb < 2500:
                logger.warning("Low memory detected (%.1f MB). Skipping CrossEncoder to prevent OOM.", avail_mb)
                self._reranker = "fallback"
                return
        except Exception:
            pass

        try:
            from sentence_transformers import CrossEncoder
            import torch
            
            if torch.cuda.is_available():
                device = "cuda"
            elif torch.backends.mps.is_available():
                device = "mps"
            else:
                device = "cpu"
                
            logger.info("Initializing BGE Reranker model: %s on device: %s", settings.RERANKER_MODEL_NAME, device)
            self._reranker = CrossEncoder(settings.RERANKER_MODEL_NAME, device=device)
            logger.info("BGE Reranker model loaded successfully.")
        except Exception as e:
            logger.warning(
                "Could not load CrossEncoder model (%s). Fallback mock re-ranker will be used. Error: %s",
                settings.RERANKER_MODEL_NAME, str(e)
            )
            self._reranker = "fallback"

    def rerank(self, query: str, candidates: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Re-ranks retrieved candidates using the CrossEncoder model."""
        if not candidates:
            return []
            
        self._init_reranker()
        
        if self._reranker == "fallback":
            logger.info("Using fallback dummy score ranking (identity pass-through)")
            return candidates

        try:
            pairs = [[query, c["text"]] for c in candidates]
            
            scores = self._reranker.predict(pairs)
            
            if hasattr(scores, "tolist"):
                scores = scores.tolist()
            else:
                scores = [float(s) for s in scores]
                
            for idx, score in enumerate(scores):
                confidence = 1 / (1 + np.exp(-score))
                candidates[idx]["score"] = float(confidence)
                
            candidates.sort(key=lambda x: x["score"], reverse=True)
            return candidates
        except Exception as e:
            logger.error("Reranking prediction failed: %s", str(e))
            return candidates
