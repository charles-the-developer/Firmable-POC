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

    # Test ABNs from readme
    test_abns = [
        "88712649015", "49991006857", "30613501612", "27776681795",
        "85832766990", "86308026589", "12850816238", "38875128921",
        "11092508586", "45891839079", "37601599422", "56638257003",
        "79002637069", "45877249165", "80776127243", "13993250709",
        "75812792400", "66264753659"
    ]

    print("\nVerifying test ABNs:")
    for abn in test_abns:
        cursor.execute("SELECT abn, main_name, status FROM businesses WHERE abn = ?", (abn,))
        business = cursor.fetchone()
        cursor.execute("SELECT state, postcode FROM addresses WHERE abn = ?", (abn,))
        address = cursor.fetchone()
        cursor.execute("SELECT name_type, name FROM alternate_names WHERE abn = ?", (abn,))
        alt_names = cursor.fetchall()

        print(f"\nABN: {abn}")
        print(f"Business: {business if business else 'Not found'}")
        print(f"Address: {address if address else 'Not found'}")
        print(f"Alternate names: {alt_names if alt_names else 'None'}")

    # Sample search query
    search_name = "%forest coach%"
    cursor.execute("SELECT abn, main_name FROM businesses WHERE main_name LIKE ?", (search_name,))
    results = cursor.fetchall()[:5]
    print(f"\nSample search for 'forest coach': {results}")

    conn.close()

if __name__ == "__main__":
    db_path = r"D:\FIRMABLE\db\abn.db"
    verify_database(db_path)