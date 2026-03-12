"""
Configuration management for the Geo-Suitability backend.
Loads settings from environment variables with sensible defaults.
"""
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    """Base configuration class"""
    
    # Flask Configuration
    DEBUG = os.getenv('FLASK_DEBUG', 'False').lower() in ('true', '1', 't')
    ENV = os.getenv('FLASK_ENV', 'development')
    PORT = int(os.getenv('PORT', 5000))
    HOST = os.getenv('HOST', '127.0.0.1')
    
    # CORS Configuration
    # In development, allow all origins. In production, specify allowed origins
    ALLOWED_ORIGINS = os.getenv('ALLOWED_ORIGINS', '*')
    if ALLOWED_ORIGINS != '*':
        ALLOWED_ORIGINS = [origin.strip() for origin in ALLOWED_ORIGINS.split(',')]
    
    # Gemini AI Configuration
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
    GEMINI_MODEL = os.getenv('GEMINI_MODEL', 'gemini-2.0-flash-exp')
    
    # AI Provider Configuration (gemini or ollama)
    AI_PROVIDER = os.getenv('AI_PROVIDER', 'gemini').lower()
    OLLAMA_BASE_URL = os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434')
    OLLAMA_MODEL = os.getenv('OLLAMA_MODEL', 'llama3')
    
    # Application Settings
    MAX_CONTENT_LENGTH = int(os.getenv('MAX_CONTENT_LENGTH', 16 * 1024 * 1024))  # 16MB default
    
    # Cache Configuration
    ENABLE_CACHE = os.getenv('ENABLE_CACHE', 'True').lower() in ('true', '1', 't')
    CACHE_TTL = int(os.getenv('CACHE_TTL', 3600))  # 1 hour default
    
    @classmethod
    def is_production(cls):
        """Check if running in production mode"""
        return cls.ENV == 'production'
    
    @classmethod
    def validate(cls):
        """Validate configuration and warn about missing critical settings"""
        warnings = []
        
        if not cls.GEMINI_API_KEY:
            warnings.append("GEMINI_API_KEY not set - AI insights will not be available")
        
        if cls.is_production() and cls.DEBUG:
            warnings.append("WARNING: Debug mode is enabled in production!")
        
        if cls.is_production() and cls.ALLOWED_ORIGINS == '*':
            warnings.append("WARNING: CORS is allowing all origins in production!")
        
        return warnings


class DevelopmentConfig(Config):
    """Development-specific configuration"""
    DEBUG = True
    ENV = 'development'


class ProductionConfig(Config):
    """Production-specific configuration"""
    DEBUG = False
    ENV = 'production'


# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}

def get_config():
    """Get the appropriate configuration based on FLASK_ENV"""
    env = os.getenv('FLASK_ENV', 'development')
    return config.get(env, config['default'])
