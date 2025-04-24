import sqlite3

def add_indexes(db_path):
    print(f"Adding indexes to {db_path}...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute("CREATE INDEX IF NOT EXISTS idx_businesses_abn ON businesses(abn)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_businesses_name ON businesses(main_name)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_alternate_names ON alternate_names(name)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_addresses_abn ON addresses(abn)")

    conn.commit()
    print("Indexes created.")
    conn.close()

if __name__ == "__main__":
    db_path = r"D:\FIRMABLE\db\abn.db"
    add_indexes(db_path)