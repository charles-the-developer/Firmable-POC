import sqlite3

def setup_fts_triggers(db_path):
    print(f"Setting up FTS5 triggers in {db_path}...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Triggers for main_entities
    cursor.execute("""
        CREATE TRIGGER IF NOT EXISTS main_entities_insert
        AFTER INSERT ON main_entities
        BEGIN
            INSERT INTO main_entities_fts(rowid, abn, name)
            VALUES (new.rowid, new.abn, new.name);
        END
    """)
    cursor.execute("""
        CREATE TRIGGER IF NOT EXISTS main_entities_delete
        AFTER DELETE ON main_entities
        BEGIN
            DELETE FROM main_entities_fts WHERE rowid = old.rowid;
        END
    """)
    cursor.execute("""
        CREATE TRIGGER IF NOT EXISTS main_entities_update
        AFTER UPDATE ON main_entities
        BEGIN
            DELETE FROM main_entities_fts WHERE rowid = old.rowid;
            INSERT INTO main_entities_fts(rowid, abn, name)
            VALUES (new.rowid, new.abn, new.name);
        END
    """)

    # Triggers for other_entities
    cursor.execute("""
        CREATE TRIGGER IF NOT EXISTS other_entities_insert
        AFTER INSERT ON other_entities
        BEGIN
            INSERT INTO other_entities_fts(rowid, abn, name)
            VALUES (new.rowid, new.abn, new.name);
        END
    """)
    cursor.execute("""
        CREATE TRIGGER IF NOT EXISTS other_entities_delete
        AFTER DELETE ON other_entities
        BEGIN
            DELETE FROM other_entities_fts WHERE rowid = old.rowid;
        END
    """)
    cursor.execute("""
        CREATE TRIGGER IF NOT EXISTS other_entities_update
        AFTER UPDATE ON other_entities
        BEGIN
            DELETE FROM other_entities_fts WHERE rowid = old.rowid;
            INSERT INTO other_entities_fts(rowid, abn, name)
            VALUES (new.rowid, new.abn, new.name);
        END
    """)

    conn.commit()
    print("FTS5 triggers created.")
    conn.close()

if __name__ == "__main__":
    db_path = r"D:\FIRMABLE\db\abn.db"
    setup_fts_triggers(db_path)