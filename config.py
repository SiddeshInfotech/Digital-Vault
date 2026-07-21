import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'vault_super_secret_jwt_key_2026_safe'
    
    # MySQL Credentials
    MYSQL_HOST = os.environ.get('MYSQL_HOST', '127.0.0.1')
    MYSQL_PORT = int(os.environ.get('MYSQL_PORT', 3306))
    MYSQL_USER = os.environ.get('MYSQL_USER', 'root')
    MYSQL_PASSWORD = os.environ.get('MYSQL_PASSWORD', '')
    MYSQL_DB = os.environ.get('MYSQL_DB', 'digital_document_vault')
    
    # Primary SQLAlchemy URI (PyMySQL driver for MySQL)
    SQLALCHEMY_DATABASE_URI = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}"
    
    # Fallback SQLite URI in case local MySQL server credentials are locked or unreachable
    SQLITE_DATABASE_URI = "sqlite:///" + os.path.join(os.path.abspath(os.path.dirname(__file__)), 'vault_local.db')
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Upload Folder
    UPLOAD_FOLDER = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'uploads')
    MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50 MB Max upload size
