from lxml import etree
import sqlite3
import glob
import os

def clean_name(name):
    """Basic cleaning: lowercase, remove extra spaces, handle nulls."""
    if not name:
        return ""
    return " ".join(name.lower().strip().split())

def clean_text(text):
    """Clean text fields, handle nulls."""
    return text.strip() if text else ""

def parse_and_insert(file_path, db_path, cursor, conn):
    print(f"Parsing {file_path}...")
    record_count = 0
    batch_size = 10000
    batch = {
        "abrs": [], "abns": [], "entity_types": [], "main_entities": [],
        "legal_entities": [], "addresses": [], "asic_numbers": [],
        "gst_statuses": [], "dgrs": [], "other_entities": []
    }

    # Iterative parsing
    context = etree.iterparse(file_path, events=("end",), tag="ABR")
    for event, elem in context:
        record_count += 1
        if record_count % 10000 == 0:
            print(f"Processed {record_count} records in {os.path.basename(file_path)}")

        # ABR attributes
        record_last_updated = clean_text(elem.get("recordLastUpdatedDate"))

        # ABN
        abn_elem = elem.find(".//ABN")
        abn = clean_text(abn_elem.text) if abn_elem is not None else ""
        status = clean_text(abn_elem.get("status")) if abn_elem is not None else ""
        status_date = clean_text(abn_elem.get("ABNStatusFromDate")) if abn_elem is not None else ""

        # Skip if ABN is missing
        if not abn:
            continue

        # Entity type
        entity_type_ind = clean_text(elem.findtext(".//EntityType/EntityTypeInd") or "")
        entity_type_text = clean_text(elem.findtext(".//EntityType/EntityTypeText") or "")

        # Main entity (non-individuals)
        main_name = ""
        main_name_type = ""
        main_name_elem = elem.find(".//MainEntity/NonIndividualName")
        if main_name_elem is not None:
            main_name_type = clean_text(main_name_elem.get("type"))
            main_name = clean_name(main_name_elem.findtext("NonIndividualNameText") or "")

        # Legal entity (individuals)
        legal_name_type = ""
        name_title = ""
        given_name = ""
        family_name = ""
        legal_name_elem = elem.find(".//LegalEntity/IndividualName")
        if legal_name_elem is not None:
            legal_name_type = clean_text(legal_name_elem.get("type"))
            name_title = clean_text(legal_name_elem.findtext("NameTitle") or "")
            given_name = clean_text(legal_name_elem.findtext("GivenName") or "")
            family_name = clean_text(legal_name_elem.findtext("FamilyName") or "")

        # Address
        state = clean_text(elem.findtext(".//BusinessAddress/AddressDetails/State") or "")
        postcode = clean_text(elem.findtext(".//BusinessAddress/AddressDetails/Postcode") or "")

        # ASIC number
        asic_number = ""
        asic_number_type = ""
        asic_elem = elem.find(".//ASICNumber")
        if asic_elem is not None:
            asic_number = clean_text(asic_elem.text or "")
            asic_number_type = clean_text(asic_elem.get("ASICNumberType") or "")

        # GST status
        gst_status = ""
        gst_status_date = ""
        gst_elem = elem.find(".//GST")
        if gst_elem is not None:
            gst_status = clean_text(gst_elem.get("status") or "")
            gst_status_date = clean_text(gst_elem.get("GSTStatusFromDate") or "")

        # DGR funds
        dgrs = []
        for dgr_elem in elem.findall(".//DGR"):
            dgr_status_date = clean_text(dgr_elem.get("DGRStatusFromDate") or "")
            dgr_name_elem = dgr_elem.find("NonIndividualName")
            dgr_name_type = clean_text(dgr_name_elem.get("type") or "") if dgr_name_elem is not None else ""
            dgr_name = clean_name(dgr_name_elem.findtext("NonIndividualNameText") or "") if dgr_name_elem is not None else ""
            if dgr_status_date or dgr_name:
                dgrs.append((dgr_status_date, dgr_name_type, dgr_name))

        # Other entities
        other_entities = []
        for other_elem in elem.findall(".//OtherEntity/NonIndividualName"):
            name_type = clean_text(other_elem.get("type") or "")
            name_text = clean_name(other_elem.findtext("NonIndividualNameText") or "")
            if name_type and name_text:
                other_entities.append((name_type, name_text))

        # Add to batch
        batch["abrs"].append((abn, record_last_updated))
        batch["abns"].append((abn, status, status_date))
        batch["entity_types"].append((abn, entity_type_ind, entity_type_text))
        if main_name:
            batch["main_entities"].append((abn, main_name_type, main_name))
        if given_name or family_name:
            batch["legal_entities"].append((abn, legal_name_type, name_title, given_name, family_name))
        if state or postcode:
            batch["addresses"].append((abn, state, postcode))
        if asic_number:
            batch["asic_numbers"].append((abn, asic_number, asic_number_type))
        if gst_status:
            batch["gst_statuses"].append((abn, gst_status, gst_status_date))
        for dgr_status_date, dgr_name_type, dgr_name in dgrs:
            batch["dgrs"].append((abn, dgr_status_date, dgr_name_type, dgr_name))
        for name_type, name in other_entities:
            batch["other_entities"].append((abn, name_type, name))

        # Insert batch every batch_size records
        if record_count % batch_size == 0:
            cursor.executemany(
                "INSERT OR IGNORE INTO abrs (abn, record_last_updated_date) VALUES (?, ?)",
                batch["abrs"]
            )
            cursor.executemany(
                "INSERT OR IGNORE INTO abns (abn, status, status_date) VALUES (?, ?, ?)",
                batch["abns"]
            )
            cursor.executemany(
                "INSERT OR IGNORE INTO entity_types (abn, entity_type_ind, entity_type_text) VALUES (?, ?, ?)",
                batch["entity_types"]
            )
            cursor.executemany(
                "INSERT OR IGNORE INTO main_entities (abn, name_type, name) VALUES (?, ?, ?)",
                batch["main_entities"]
            )
            cursor.executemany(
                "INSERT OR IGNORE INTO legal_entities (abn, name_type, name_title, given_name, family_name) VALUES (?, ?, ?, ?, ?)",
                batch["legal_entities"]
            )
            cursor.executemany(
                "INSERT OR IGNORE INTO addresses (abn, state, postcode) VALUES (?, ?, ?)",
                batch["addresses"]
            )
            cursor.executemany(
                "INSERT OR IGNORE INTO asic_numbers (abn, asic_number, asic_number_type) VALUES (?, ?, ?)",
                batch["asic_numbers"]
            )
            cursor.executemany(
                "INSERT OR IGNORE INTO gst_statuses (abn, status, status_date) VALUES (?, ?, ?)",
                batch["gst_statuses"]
            )
            cursor.executemany(
                "INSERT OR IGNORE INTO dgrs (abn, status_date, name_type, name) VALUES (?, ?, ?, ?)",
                batch["dgrs"]
            )
            cursor.executemany(
                "INSERT OR IGNORE INTO other_entities (abn, name_type, name) VALUES (?, ?, ?)",
                batch["other_entities"]
            )
            conn.commit()
            batch = {
                "abrs": [], "abns": [], "entity_types": [], "main_entities": [],
                "legal_entities": [], "addresses": [], "asic_numbers": [],
                "gst_statuses": [], "dgrs": [], "other_entities": []
            }
            print(f"Inserted batch at {record_count} records in {os.path.basename(file_path)}")

        # Clear element to free memory
        elem.clear()
        while elem.getprevious() is not None:
            del elem.getparent()[0]

    # Insert remaining records
    if batch["abrs"]:
        cursor.executemany(
            "INSERT OR IGNORE INTO abrs (abn, record_last_updated_date) VALUES (?, ?)",
            batch["abrs"]
        )
        cursor.executemany(
            "INSERT OR IGNORE INTO abns (abn, status, status_date) VALUES (?, ?, ?)",
            batch["abns"]
        )
        cursor.executemany(
            "INSERT OR IGNORE INTO entity_types (abn, entity_type_ind, entity_type_text) VALUES (?, ?, ?)",
            batch["entity_types"]
        )
        cursor.executemany(
            "INSERT OR IGNORE INTO main_entities (abn, name_type, name) VALUES (?, ?, ?)",
            batch["main_entities"]
        )
        cursor.executemany(
            "INSERT OR IGNORE INTO legal_entities (abn, name_type, name_title, given_name, family_name) VALUES (?, ?, ?, ?, ?)",
            batch["legal_entities"]
        )
        cursor.executemany(
            "INSERT OR IGNORE INTO addresses (abn, state, postcode) VALUES (?, ?, ?)",
            batch["addresses"]
        )
        cursor.executemany(
            "INSERT OR IGNORE INTO asic_numbers (abn, asic_number, asic_number_type) VALUES (?, ?, ?)",
            batch["asic_numbers"]
        )
        cursor.executemany(
            "INSERT OR IGNORE INTO gst_statuses (abn, status, status_date) VALUES (?, ?, ?)",
            batch["gst_statuses"]
        )
        cursor.executemany(
            "INSERT OR IGNORE INTO dgrs (abn, status_date, name_type, name) VALUES (?, ?, ?, ?)",
            batch["dgrs"]
        )
        cursor.executemany(
            "INSERT OR IGNORE INTO other_entities (abn, name_type, name) VALUES (?, ?, ?)",
            batch["other_entities"]
        )
        conn.commit()

    print(f"Completed {file_path}: {record_count} records processed")

def process_all_files(xml_dir, db_path):
    print(f"Processing all XML files in {xml_dir}...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Get all XML files
    xml_files = glob.glob(os.path.join(xml_dir, "20250409_Public*.xml"))
    xml_files.sort()  # Process in order (01 to 20)

    for file_path in xml_files:
        parse_and_insert(file_path, db_path, cursor, conn)

    conn.close()
    print("All files processed.")

if __name__ == "__main__":
    xml_dir = r"D:\FIRMABLE\data\xml"
    db_path = r"D:\FIRMABLE\db\abn.db"
    process_all_files(xml_dir, db_path)