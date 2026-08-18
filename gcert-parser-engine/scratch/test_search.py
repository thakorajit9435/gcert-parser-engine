import sys
import os

# Align python path to project root
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.pipeline.router import semantic_search, SearchRequest, SearchFilters
from src.core.logger import logger
import asyncio

async def test():
    print("--- TESTING HYBRID SEMANTIC SEARCH ON QDRANT ---")
    query = "ભાષા અને ઉચ્ચારણનો વિકાસ કેવી રીતે થાય?"
    print(f"Query: {query}\n")
    
    req = SearchRequest(
        query=query,
        filters=SearchFilters(standard="6"),
        top_k=3,
        min_confidence=0.10 # low threshold for test output
    )
    
    try:
        res = await semantic_search(req)
        print(f"Search complete! Found {res.resultsCount} results:")
        for idx, item in enumerate(res.results):
            print(f"\n[{idx + 1}] Confidence Score: {item.confidenceScore}")
            print(f"    Chapter: {item.sourceChapter}")
            print(f"    Topic: {item.sourceTopic}")
            print(f"    Page Number: {item.chunk.pageNumber}")
            print(f"    Text Chunk: {item.chunk.content[:200]}...")
            
    except Exception as e:
        print(f"❌ Search test failed: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test())
