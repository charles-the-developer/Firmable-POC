# ABR Search POC

## Getting Started

1. Download the `ABR Search POC` folder. Google drive will initiate 2 downloads, one for the folder and another for the database file `abn.db`.

2. Copy `abn.db` to the `db` folder.

3. Update line 15 in `frontend/src/app/api/search` with the path to abn.db.

3. Run `npm i` from within the `frontend` folder to install dependancies.

4. Run `npm run dev` from within the `frontend` folder to start the application.


### Note

- The `scripts` folder contains python scripts used to 

    - **setup_db.py** - create the SQLite database. 
    - **parse_xml.py** - extract and clean data from the xml dump, then load it into the SQLite database.
    - **verify_db.py** - verify that the data was correctly loaded to the db.
    - **index_db.py** - add indexes to the database.
    - **setup_fts.py** and **setup_fts_triggers.py** - set up full text search and triggers for faster db quesries. 

