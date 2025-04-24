import sqlite3

def verify_database(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Count records in all tables
    # tables = [
    #     "abrs", "abns", "entity_types", "main_entities", "legal_entities",
    #     "addresses", "asic_numbers", "gst_statuses", "dgrs", "other_entities"
    # ]
    # for table in tables:
    #     cursor.execute(f"SELECT COUNT(*) FROM {table}")
    #     print(f"{table} count: {cursor.fetchone()[0]}")

    # Test ABNs
    test_abns = [
        "88712649015", "49991006857", "30613501612", "27776681795",
        "85832766990", "86308026589", "12850816238", "38875128921",
        "11092508586", "45891839079", "37601599422", "56638257003",
        "79002637069", "45877249165", "80776127243", "13993250709",
        "75812792400", "66264753659"
    ]

    print("\nVerifying test ABNs:")
    for abn in test_abns:
        print(f"\nABN: {abn}")
        cursor.execute("SELECT * FROM abrs WHERE abn = ?", (abn,))
        print(f"ABR: {cursor.fetchone() or 'Not found'}")
        cursor.execute("SELECT * FROM abns WHERE abn = ?", (abn,))
        print(f"ABN: {cursor.fetchone() or 'Not found'}")
        cursor.execute("SELECT * FROM entity_types WHERE abn = ?", (abn,))
        print(f"Entity Type: {cursor.fetchone() or 'Not found'}")
        cursor.execute("SELECT * FROM main_entities WHERE abn = ?", (abn,))
        print(f"Main Entity: {cursor.fetchall() or 'Not found'}")
        cursor.execute("SELECT * FROM legal_entities WHERE abn = ?", (abn,))
        print(f"Legal Entity: {cursor.fetchall() or 'Not found'}")
        cursor.execute("SELECT * FROM addresses WHERE abn = ?", (abn,))
        print(f"Address: {cursor.fetchall() or 'Not found'}")
        cursor.execute("SELECT * FROM asic_numbers WHERE abn = ?", (abn,))
        print(f"ASIC Number: {cursor.fetchall() or 'Not found'}")
        cursor.execute("SELECT * FROM gst_statuses WHERE abn = ?", (abn,))
        print(f"GST Status: {cursor.fetchall() or 'Not found'}")
        cursor.execute("SELECT * FROM dgrs WHERE abn = ?", (abn,))
        print(f"DGR: {cursor.fetchall() or 'Not found'}")
        cursor.execute("SELECT * FROM other_entities WHERE abn = ?", (abn,))
        print(f"Other Entities: {cursor.fetchall() or 'Not found'}")

    # Sample search
    # search_name = "%forest coach%"
    # cursor.execute("SELECT abn, name FROM main_entities WHERE name LIKE ?", (search_name,))
    # print(f"\nSample search for 'forest coach' in main_entities: {cursor.fetchall()[:5]}")
    # cursor.execute("SELECT abn, name FROM other_entities WHERE name LIKE ?", (search_name,))
    # print(f"Sample search for 'forest coach' in other_entities: {cursor.fetchall()[:5]}")

    conn.close()

if __name__ == "__main__":
    db_path = r"D:\FIRMABLE\db\abn.db"
    verify_database(db_path)