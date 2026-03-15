# Data Model: Singpass Myinfo Userinfo Catalog Alignment

## Entities

### `MyinfoPerson`
Represents the comprehensive profile of a Singpass user, composed of all 7 catalog domains.

#### Core Attributes (from Personal Catalog)
- `uinfin`: string (NRIC/FIN)
- `partialuinfin`: string
- `name`: string
- `aliasname`: string | null
- `hanyupinyinname`: string | null
- `hanyupinyinaliasname`: string | null
- `marriedname`: string | null
- `sex`: string (Code)
- `race`: string (Code)
- `secondaryrace`: string (Code) | null
- `dialect`: string (Code) | null
- `dob`: string (YYYY-MM-DD)
- `residentialstatus`: string (Code)
- `nationality`: string (Code)
- `birthcountry`: string (Code)
- `passportnumber`: string | null
- `passportexpirydate`: string | null
- `passtype`: string (Code) | null
- `passstatus`: string (Code) | null
- `passexpirydate`: string | null
- `employmentsector`: string | null
- `mobileno`: object { prefix, areacode, nbr }
- `email`: string
- `regadd`: object (Address structure)
- `hdbtype`: string (Code) | null
- `housingtype`: string (Code) | null

#### Embedded Domains (Referenced)
- **Finance**: Income, CPF contributions, assessments.
- **Education & Employment**: Highest education level, occupation, employer.
- **Family**: Marital status, marriage details, children, sponsor.
- **Vehicle & Driving Licence**: Vehicle numbers, driving licence classes.
- **Property**: Property ownership details.
- **Government Scheme**: Various grants or schemes status.

*Note: For the database representation, the catalogs can be stored either as individual normalized tables linking to the User ID, or as a structured JSON column (`catalog_data`) in a `users` or `myinfo_profiles` table, depending on the most efficient Drizzle ORM mapping.*

## Constraints & Rules
- **Explicit Nulls**: If a user does not have data for a requested scope/catalog field, the system must return `null` rather than omitting the key.
- **Data Wrapper**: When serialized for the API response, primitive fields must be wrapped in an object containing a `value` key, e.g., `{"name": {"value": "JOHN DOE"}}`. Complex objects like `mobileno` may have a nested structure that wraps the values.
- **Default Seeding**: Mock users seeded into the database must have their password hash correspond to `test1234`.