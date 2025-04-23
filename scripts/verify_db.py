import sqlite3

def verify_database(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Count records
    cursor.execute("SELECT COUNT(*) FROM businesses")
    print(f"Businesses count: {cursor.fetchone()[0]}")
    cursor.execute("SELECT COUNT(*) FROM addresses")
    print(f"Addresses count: {cursor.fetchone()[0]}")
    cursor.execute("SELECT COUNT(*) FROM alternate_names")
    print(f"Alternate names count: {cursor.fetchone()[0]}")

    # Check test ABN (from readme)
    test_abn = "12850816238"
    cursor.execute("SELECT * FROM businesses WHERE abn = ?", (test_abn,))
    print(f"Test ABN {test_abn}: {cursor.fetchall()}")
    cursor.execute("SELECT * FROM addresses WHERE abn = ?", (test_abn,))
    print(f"Address for {test_abn}: {cursor.fetchall()}")
    cursor.execute("SELECT * FROM alternate_names WHERE abn = ?", (test_abn,))
    print(f"Alternate names for {test_abn}: {cursor.fetchall()}")

    # Sample search query
    search_name = "%forest coach%"
    cursor.execute("SELECT abn, main_name FROM businesses WHERE main_name LIKE ?", (search_name,))
    print(f"Sample search for 'forest coach': {cursor.fetchall()[:5]}")

    conn.close()

if __name__ == "__main__":
    db_path = r"D:\FIRMABLE\db\abn.db"
    verify_database(db_path)