import sqlite3
import pandas as pd
from sqlalchemy import create_engine

# Thông tin kết nối MySQL
mysql_user = 'root'
mysql_password = 'YOUR_PASSWORD_HERE'   # ⬅️ Thay bằng mật khẩu MySQL
mysql_host = 'localhost'
mysql_port = 3306
mysql_db = 'taxi_data'

# Tạo engine kết nối đến MySQL
engine = create_engine(f"mysql+mysqlconnector://{mysql_user}:{mysql_password}@{mysql_host}:{mysql_port}/{mysql_db}")

# Kết nối đến SQLite
sqlite_conn = sqlite3.connect('./data13.db')  # đảm bảo đường dẫn đúng
cursor = sqlite_conn.cursor()

# Lấy danh sách các bảng trong SQLite
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()

# Chuyển từng bảng
for table_name in tables:
    table = table_name[0]
    print(f"Đang chuyển bảng: {table}")
    
    df = pd.read_sql_query(f"SELECT * FROM {table}", sqlite_conn)
    
    df.to_sql(table, engine, if_exists='replace', index=False)
    print(f"✅ Đã chuyển bảng {table} ({len(df)} dòng) sang MySQL.")

# Đóng kết nối
sqlite_conn.close()
print("✅ Hoàn tất chuyển dữ liệu.")
