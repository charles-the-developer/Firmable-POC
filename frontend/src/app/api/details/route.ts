import { NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';

interface DetailResult {
  abn: string;
  status: string | null;
  statusDate: string | null;
  lastUpdated: string | null;
  entityTypeInd: string | null;
  entityTypeText: string | null;
  mainName: { name: string; type: string } | null;
  legalName: { title: string; givenName: string; familyName: string; type: string } | null;
  address: { state: string; postcode: string } | null;
  asicNumber: { number: string; type: string } | null;
  gst: { status: string; statusDate: string } | null;
  dgrs: { statusDate: string; name: string; type: string }[];
  otherNames: { name: string; type: string }[];
}

let db: sqlite3.Database | null = null;

function getDb() {
  if (!db) {
    db = new sqlite3.Database('C:\\Users\\codeswag.co.uk\\github\\FIRMABLE\\db\\abn.db', sqlite3.OPEN_READONLY, (err) => {
      if (err) console.error('Database connection error:', err);
    });
  }
  return db;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const abn = searchParams.get('abn')?.trim() || '';

  if (!abn) {
    return NextResponse.json({ error: 'ABN is required' }, { status: 400 });
  }

  const db = getDb();

  try {
    const startTime = Date.now(); // Log start time for performance tracking

    // Fetch ABN details
    const abnDetails: { abn: string; status: string; statusDate: string; lastUpdated: string } | undefined = await new Promise((resolve, reject) => {
      const sql = `
        SELECT abr.abn, abn.status, abn.status_date as statusDate, abr.record_last_updated_date as lastUpdated
        FROM abrs abr
        LEFT JOIN abns abn ON abr.abn = abn.abn
        WHERE abr.abn = ?
      `;
      db.get(sql, [abn], (err, row: any) => {
        if (err) reject(err);
        resolve(row);
      });
    });

    if (!abnDetails) {
      return NextResponse.json({ error: 'ABN not found' }, { status: 404 });
    }

    // Fetch entity type
    const entityType: { entityTypeInd: string; entityTypeText: string } | undefined = await new Promise((resolve, reject) => {
      const sql = `
        SELECT entity_type_ind as entityTypeInd, entity_type_text as entityTypeText
        FROM entity_types
        WHERE abn = ?
      `;
      db.get(sql, [abn], (err, row: any) => {
        if (err) reject(err);
        resolve(row);
      });
    });

    // Fetch main entity (non-individuals)
    const mainName: { name: string; type: string } | undefined = await new Promise((resolve, reject) => {
      const sql = `
        SELECT name, name_type as type
        FROM main_entities
        WHERE abn = ?
        LIMIT 1
      `;
      db.get(sql, [abn], (err, row: any) => {
        if (err) reject(err);
        resolve(row);
      });
    });

    // Fetch legal entity (individuals)
    const legalName: { title: string; givenName: string; familyName: string; type: string } | undefined = await new Promise((resolve, reject) => {
      const sql = `
        SELECT name_title as title, given_name as givenName, family_name as familyName, name_type as type
        FROM legal_entities
        WHERE abn = ?
        LIMIT 1
      `;
      db.get(sql, [abn], (err, row: any) => {
        if (err) reject(err);
        resolve(row);
      });
    });

    // Fetch address
    const address: { state: string; postcode: string } | undefined = await new Promise((resolve, reject) => {
      const sql = `
        SELECT state, postcode
        FROM addresses
        WHERE abn = ?
        LIMIT 1
      `;
      db.get(sql, [abn], (err, row: any) => {
        if (err) reject(err);
        resolve(row);
      });
    });

    // Fetch ASIC number
    const asicNumber: { number: string; type: string } | undefined = await new Promise((resolve, reject) => {
      const sql = `
        SELECT asic_number as number, asic_number_type as type
        FROM asic_numbers
        WHERE abn = ?
        LIMIT 1
      `;
      db.get(sql, [abn], (err, row: any) => {
        if (err) reject(err);
        resolve(row);
      });
    });

    // Fetch GST status
    const gst: { status: string; statusDate: string } | undefined = await new Promise((resolve, reject) => {
      const sql = `
        SELECT status, status_date as statusDate
        FROM gst_statuses
        WHERE abn = ?
        LIMIT 1
      `;
      db.get(sql, [abn], (err, row: any) => {
        if (err) reject(err);
        resolve(row);
      });
    });

    // Fetch DGR funds
    const dgrs: { statusDate: string; name: string; type: string }[] = await new Promise((resolve, reject) => {
      const sql = `
        SELECT status_date as statusDate, name, name_type as type
        FROM dgrs
        WHERE abn = ?
      `;
      db.all(sql, [abn], (err, rows: any[]) => {
        if (err) reject(err);
        resolve(rows);
      });
    });

    // Fetch other entities (business/trading names)
    const otherNames: { name: string; type: string }[] = await new Promise((resolve, reject) => {
      const sql = `
        SELECT name, name_type as type
        FROM other_entities
        WHERE abn = ?
      `;
      db.all(sql, [abn], (err, rows: any[]) => {
        if (err) reject(err);
        resolve(rows);
      });
    });

    const result: DetailResult = {
      abn: abnDetails.abn,
      status: abnDetails.status,
      statusDate: abnDetails.statusDate,
      lastUpdated: abnDetails.lastUpdated,
      entityTypeInd: entityType?.entityTypeInd || null,
      entityTypeText: entityType?.entityTypeText || null,
      mainName: mainName || null,
      legalName: legalName || null,
      address: address || null,
      asicNumber: asicNumber || null,
      gst: gst || null,
      dgrs,
      otherNames,
    };

    const endTime = Date.now(); // Log end time
    console.log(`Details query for ABN "${abn}" took ${endTime - startTime}ms`);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

process.on('SIGINT', () => {
  if (db) {
    db.close(() => {
      console.log('Database connection closed.');
      process.exit(0);
    });
  }
});