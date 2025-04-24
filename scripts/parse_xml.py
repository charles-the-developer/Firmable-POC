from lxml import etree
import sqlite3
import glob
import os

def clean_name(name):
    """Basic cleaning: lowercase, remove extra spaces, handle nulls."""
    if not name:
        return ""
    return " ".join(name.lower().strip().split())

def parse_and_insert(file_path, db_path, cursor, conn):
    print(f"Parsing {file_path}...")
    record_count = 0
    batch_size = 10000
    batch = {"businesses": [], "addresses": [], "alternate_names": []}

    # Iterative parsing
    context = etree.iterparse(file_path, events=("end",), tag="ABR")
    for event, elem in context:
        record_count += 1
        if record_count % 10000 == 0:
            print(f"Processed {record_count} records in {os.path.basename(file_path)}")

        # Extract ABN and status
        abn_elem = elem.find(".//ABN")
        abn = abn_elem.text if abn_elem is not None else ""
        status = abn_elem.get("status") if abn_elem is not None else ""
        status_date = abn_elem.get("ABNStatusFromDate") if abn_elem is not None else ""

        # Skip if ABN is missing
        if not abn:
            continue

        # Extract main name
        main_name = ""
        if elem.find(".//MainEntity/NonIndividualName/NonIndividualNameText") is not None:
            main_name = elem.find(".//MainEntity/NonIndividualName/NonIndividualNameText").text or ""
        elif elem.find(".//LegalEntity/IndividualName/GivenName") is not None:
            given_name = elem.find(".//LegalEntity/IndividualName/GivenName").text or ""
            family_name = elem.find(".//LegalEntity/IndividualName/FamilyName").text or ""
            main_name = f"{given_name} {family_name}".strip()
        main_name = clean_name(main_name)

        # Extract address
        state_elem = elem.find(".//BusinessAddress/AddressDetails/State")
        state = state_elem.text if state_elem is not None else ""
        postcode_elem = elem.find(".//BusinessAddress/AddressDetails/Postcode")
        postcode = postcode_elem.text if postcode_elem is not None else ""

        # Extract trading/business names
        trading_names = []
        for other_elem in elem.findall(".//OtherEntity/NonIndividualName"):
            name_type = other_elem.get("type")
            if name_type in ("TRD", "BN", "OTN"):
                name_text = other_elem.find("NonIndividualNameText").text
                if name_text:
                    trading_names.append((name_type, clean_name(name_text)))

        # Add to batch
        batch["businesses"].append((abn, main_name, status, status_date))
        if state or postcode:
            batch["addresses"].append((abn, state, postcode))
        for name_type, name in trading_names:
            batch["alternate_names"].append((abn, name_type, name))

        # Insert batch every batch_size records
        if record_count % batch_size == 0:
            cursor.executemany(
                "INSERT OR IGNORE INTO businesses (abn, main_name, status, status_date) VALUES (?, ?, ?, ?)",
                batch["businesses"]
            )
            cursor.executemany(
                "INSERT OR IGNORE INTO addresses (abn, state, postcode) VALUES (?, ?, ?)",
                batch["addresses"]
            )
            cursor.executemany(
                "INSERT OR IGNORE INTO alternate_names (abn, name_type, name) VALUES (?, ?, ?)",
                batch["alternate_names"]
            )
            conn.commit()
            batch = {"businesses": [], "addresses": [], "alternate_names": []}
            print(f"Inserted batch at {record_count} records in {os.path.basename(file_path)}")

        # Clear element to free memory
        elem.clear()
        while elem.getprevious() is not None:
            del elem.getparent()[0]

    # Insert remaining records
    if batch["businesses"]:
        cursor.executemany(
            "INSERT OR IGNORE INTO businesses (abn, main_name, status, status_date) VALUES (?, ?, ?, ?)",
            batch["businesses"]
        )
        cursor.executemany(
            "INSERT OR IGNORE INTO addresses (abn, state, postcode) VALUES (?, ?, ?)",
            batch["addresses"]
        )
        cursor.executemany(
            "INSERT OR IGNORE INTO alternate_names (abn, name_type, name) VALUES (?, ?, ?)",
            batch["alternate_names"]
        )
        conn.commit()

    print(f"Completed {file_path}: {record_count} records processed")

def process_all_files(xml_dir, db_path):
    print(f"Processing all XML files in {xml_dir}...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Get all XML files
    xml_files = glob.glob(os.path.join(xml_dir, "20250409_Public*.xml"))
    xml_files.sort()  # Ensure files are processed in order (01 to 20)

    for file_path in xml_files:
        parse_and_insert(file_path, db_path, cursor, conn)

    conn.close()
    print("All files processed.")

if __name__ == "__main__":
    xml_dir = r"D:\FIRMABLE\data\xml"
    db_path = r"D:\FIRMABLE\db\abn.db"
    process_all_files(xml_dir, db_path)