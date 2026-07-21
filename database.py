import pymysql
from config import Config
from models import db, User, Category, Document, SharedDocument, SupportTicket

def init_db(app):
    # Try connecting to MySQL to ensure DB exists
    mysql_connected = False
    try:
        conn = pymysql.connect(
            host=Config.MYSQL_HOST,
            port=Config.MYSQL_PORT,
            user=Config.MYSQL_USER,
            password=Config.MYSQL_PASSWORD,
            connect_timeout=3
        )
        cursor = conn.cursor()
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{Config.MYSQL_DB}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
        conn.close()
        mysql_connected = True
        app.config['SQLALCHEMY_DATABASE_URI'] = Config.SQLALCHEMY_DATABASE_URI
        print(f"[MySQL] Successfully connected to MySQL database server at {Config.MYSQL_HOST}:{Config.MYSQL_PORT}/{Config.MYSQL_DB}")
    except Exception as e:
        print(f"[MySQL Notice] Could not connect to MySQL server ({e}).")
        print(f"[Fallback] Initializing SQLite local database engine as fallback: {Config.SQLITE_DATABASE_URI}")
        app.config['SQLALCHEMY_DATABASE_URI'] = Config.SQLITE_DATABASE_URI

    db.init_app(app)

    with app.app_context():
        db.create_all()
        print("[Database] All tables initialized successfully!")