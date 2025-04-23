from lxml import etree

def parse_xml(file_path):
    print(f"Parsing {file_path}...")
    record_count = 0
    test_abns = {
        "88712649015", 
        "49991006857",
        "30613501612",
        "27776681795",
        "27776681795",
        "85832766990",
        "86308026589",
        "12850816238",
        "38875128921",
        "11092508586",
        "45891839079",
        "37601599422",
        "56638257003",
        "79002637069",
        "45877249165",
        "80776127243",
        "13993250709",
        "75812792400",
        "66264753659",
    }

    # Iterative parsing for <ABR> elements
    context = etree.iterparse(file_path, events=("end",), tag="ABR")
    for event, elem in context:
        record_count += 1
        if record_count % 10000 == 0:
            print(f"Processed {record_count} records")

        # Extract ABN and status
        abn_elem = elem.find(".//ABN")
        abn = abn_elem.text if abn_elem is not None else ""
        status = abn_elem.get("status") if abn_elem is not None else ""
        status_date = abn_elem.get("ABNStatusFromDate") if abn_elem is not None else ""

        # Extract main name (NonIndividualName or IndividualName for IND)
        main_name = ""
        if elem.find(".//MainEntity/NonIndividualName/NonIndividualNameText") is not None:
            main_name = elem.find(".//MainEntity/NonIndividualName/NonIndividualNameText").text or ""
        elif elem.find(".//LegalEntity/IndividualName/GivenName") is not None:
            given_name = elem.find(".//LegalEntity/IndividualName/GivenName").text or ""
            family_name = elem.find(".//LegalEntity/IndividualName/FamilyName").text or ""
            main_name = f"{given_name} {family_name}".strip()

        # Extract address
        state_elem = elem.find(".//BusinessAddress/AddressDetails/State")
        state = state_elem.text if state_elem is not None else ""
        postcode_elem = elem.find(".//BusinessAddress/AddressDetails/Postcode")
        postcode = postcode_elem.text if postcode_elem is not None else ""

        # Extract trading/business names (OtherEntity with type=TRD or BN)
        trading_names = []
        for other_elem in elem.findall(".//OtherEntity/NonIndividualName"):
            name_type = other_elem.get("type")
            if name_type in ("TRD", "BN"):
                name_text = other_elem.find("NonIndividualNameText").text
                if name_text:
                    trading_names.append({"type": name_type, "name": name_text})

        # Print record if it’s a test ABN or every 100,000th record
        if abn in test_abns or record_count % 100000 == 0:
            print({
                "abn": abn,
                "status": status,
                "status_date": status_date,
                "main_name": main_name,
                "state": state,
                "postcode": postcode,
                "trading_names": trading_names
            })

        # Clear element to free memory
        elem.clear()
        while elem.getprevious() is not None:
            del elem.getparent()[0]

    print(f"Total records processed: {record_count}")

if __name__ == "__main__":
    file_path = r"D:\FIRMABLE\data\xml\20250409_Public01.xml" 
    parse_xml(file_path)