import sqlite3
import sys
conn = sqlite3.connect(r'c:\Users\nikhil\EpiChat\backend\data\epichat.db')
cur = conn.cursor()
try:
    cur.execute("ALTER TABLE users ADD COLUMN role VARCHAR(32) DEFAULT 'user';")
    conn.commit()
    print('Done')
except Exception as e:
    print('Error:', e)
conn.close()
