import sys
import os

# Align python path to project root
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from qdrant_client.http import models

try:
    print("Testing scalar quantization instantiation...")
    qc = models.ScalarQuantization(
        scalar=models.ScalarQuantizationConfig(
            type=models.ScalarType.INT8,
            always_ram=True
        )
    )
    print("Success creating ScalarQuantization:", qc)
except Exception as e:
    import traceback
    print("Error:")
    traceback.print_exc()
