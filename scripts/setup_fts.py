import sqlite3

def setup_fts(db_path):
    print(f"Setting up FTS5 tables in {db_path}...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Create FTS5 tables
    cursor.execute("""
        CREATE VIRTUAL TABLE IF NOT EXISTS main_entities_fts USING fts5(
            abn, name, content='main_entities', content_rowid='rowid'
        )
    """)
    cursor.execute("""
        CREATE VIRTUAL TABLE IF NOT EXISTS other_entities_fts USING fts5(
            abn, name, content='other_entities', content_rowid='rowid'
        )
    """)

    # Populate FTS5 tables
    cursor.execute("""
        INSERT INTO main_entities_fts(rowid, abn, name)
        SELECT rowid, abn, name FROM main_entities
    """)
    cursor.execute("""
        INSERT INTO other_entities_fts(rowid, abn, name)
        SELECT rowid, abn, name FROM other_entities
    """)

    conn.commit()
    print("FTS5 tables created and populated.")
    conn.close()

if __name__ == "__main__":
    db_path = r"D:\FIRMABLE\db\abn.db"
    setup_fts(db_path)