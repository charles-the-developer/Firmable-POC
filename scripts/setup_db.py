import sqlite3

def setup_database(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Create tables
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS businesses (
            abn TEXT PRIMARY KEY,
            main_name TEXT,
            status TEXT,
            status_date TEXT
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS addresses (
            abn TEXT,
            state TEXT,
            postcode TEXT,
            FOREIGN KEY (abn) REFERENCES businesses(abn)
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS alternate_names (
            abn TEXT,
            name_type TEXT,
            name TEXT,
            FOREIGN KEY (abn) REFERENCES businesses(abn)
        )
    """)

    # Test insert
    cursor.execute("""
        INSERT INTO businesses (abn, main_name, status, status_date)
        VALUES (?, ?, ?, ?)
    """, ("11000037409", "FOREST COACH LINES PTY LTD", "ACT", "20000317"))
    cursor.execute("""
        INSERT INTO addresses (abn, state, postcode)
        VALUES (?, ?, ?)
    """, ("11000037409", "NSW", "2084"))
    cursor.execute("""
        INSERT INTO alternate_names (abn, name_type, name)
        VALUES (?, ?, ?)
    """, ("11000037409", "BN", "CDC NSW MID NORTH COAST"))
    cursor.execute("""
        INSERT INTO alternate_names (abn, name_type, name)
        VALUES (?, ?, ?)
    """, ("11000037409", "BN", "Woopi Connect"))

    conn.commit()
    print("Database created and sample record inserted.")

    # Verify
    cursor.execute("SELECT * FROM businesses")
    print("Businesses:", cursor.fetchall())
    cursor.execute("SELECT * FROM addresses")
    print("Addresses:", cursor.fetchall())
    cursor.execute("SELECT * FROM alternate_names")
    print("Alternate Names:", cursor.fetchall())

    conn.close()

if __name__ == "__main__":
    db_path = r"D:\FIRMABLE\db\abn.db"
    setup_database(db_path)