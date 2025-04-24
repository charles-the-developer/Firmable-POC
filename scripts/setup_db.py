import sqlite3

def setup_database(db_path):
    print(f"Creating database at {db_path}...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # ABR (root record)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS abrs (
            abn TEXT PRIMARY KEY,
            record_last_updated_date TEXT
        )
    """)

    # ABN details
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS abns (
            abn TEXT PRIMARY KEY,
            status TEXT,
            status_date TEXT,
            FOREIGN KEY (abn) REFERENCES abrs(abn)
        )
    """)

    # Entity type
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS entity_types (
            abn TEXT PRIMARY KEY,
            entity_type_ind TEXT,
            entity_type_text TEXT,
            FOREIGN KEY (abn) REFERENCES abrs(abn)
        )
    """)

    # Main entity (non-individuals)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS main_entities (
            abn TEXT,
            name_type TEXT,
            name TEXT,
            FOREIGN KEY (abn) REFERENCES abrs(abn)
        )
    """)

    # Legal entity (individuals)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS legal_entities (
            abn TEXT,
            name_type TEXT,
            name_title TEXT,
            given_name TEXT,
            family_name TEXT,
            FOREIGN KEY (abn) REFERENCES abrs(abn)
        )
    """)

    # Business address
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS addresses (
            abn TEXT,
            state TEXT,
            postcode TEXT,
            FOREIGN KEY (abn) REFERENCES abrs(abn)
        )
    """)

    # ASIC number
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS asic_numbers (
            abn TEXT,
            asic_number TEXT,
            asic_number_type TEXT,
            FOREIGN KEY (abn) REFERENCES abrs(abn)
        )
    """)

    # GST status
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS gst_statuses (
            abn TEXT,
            status TEXT,
            status_date TEXT,
            FOREIGN KEY (abn) REFERENCES abrs(abn)
        )
    """)

    # DGR funds
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS dgrs (
            abn TEXT,
            status_date TEXT,
            name_type TEXT,
            name TEXT,
            FOREIGN KEY (abn) REFERENCES abrs(abn)
        )
    """)

    # Other entities (trading/business names)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS other_entities (
            abn TEXT,
            name_type TEXT,
            name TEXT,
            FOREIGN KEY (abn) REFERENCES abrs(abn)
        )
    """)

    conn.commit()
    print("Database schema created.")
    conn.close()

if __name__ == "__main__":
    db_path = r"D:\FIRMABLE\db\abn.db"
    setup_database(db_path)