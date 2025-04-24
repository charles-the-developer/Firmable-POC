import sqlite3

def add_indexes(db_path):
    print(f"Adding indexes to {db_path}...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute("CREATE INDEX IF NOT EXISTS idx_abrs_abn ON abrs(abn)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_abns_abn ON abns(abn)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_entity_types_abn ON entity_types(abn)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_main_entities_abn ON main_entities(abn)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_main_entities_name ON main_entities(name)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_legal_entities_abn ON legal_entities(abn)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_addresses_abn ON addresses(abn)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_asic_numbers_abn ON asic_numbers(abn)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_gst_statuses_abn ON gst_statuses(abn)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_dgrs_abn ON dgrs(abn)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_other_entities_abn ON other_entities(abn)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_other_entities_name ON other_entities(name)")

    conn.commit()
    print("Indexes created.")
    conn.close()

if __name__ == "__main__":
    db_path = r"D:\FIRMABLE\db\abn.db"
    add_indexes(db_path)