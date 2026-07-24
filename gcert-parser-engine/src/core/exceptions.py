class ParserEngineException(Exception):
    """Base exception class for the GCERT parsing engine."""
    pass

class FileValidationError(ParserEngineException):
    """Raised when PDF upload or file schema validation fails."""
    pass

class LayoutAnalysisError(ParserEngineException):
    """Raised when the layout analysis or column boundary matching fails."""
    pass

class OCRProcessingError(ParserEngineException):
    """Raised when the OCR extraction fails or returns corrupt results."""
    pass

class LLMProcessingError(ParserEngineException):
    """Raised when LLM extraction or Pydantic output validation fails."""
    pass

class FirestoreLoaderError(ParserEngineException):
    """Raised when transaction uploads or Firestore imports fail."""
    pass
