import psycopg2

try:
    conn = psycopg2.connect(
        host="dpg-d9fr4davr4c73crag50-a.oregon-postgres.render.com",
        port=5432,
        database="talent_ia",
        user="talent_user",
        password="AcSNcFltMFnC1UBJhstSE8wCKLUMFdj"
    )
    
    with open("backend/scripts/initComplete.sql", "r") as f:
        sql = f.read()
    
    cur = conn.cursor()
    cur.execute(sql)
    conn.commit()
    cur.close()
    conn.close()
    
    print("✅ Database initialized successfully!")
except Exception as e:
    print(f"❌ Error: {e}")