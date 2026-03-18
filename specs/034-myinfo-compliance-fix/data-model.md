# Data Model: Singpass MyInfo Compliance Fixes

## Entity: MyinfoValue<T>

A generic wrapper for all MyInfo fields, ensuring consistent metadata across the catalog.

| Field | Type | Mandatory | Description |
|-------|------|-----------|-------------|
| value | T | Yes | The actual data value (nullable) |
| source | string | Yes | Data origin code (e.g., "1" for government) |
| classification | string | Yes | Data sensitivity (e.g., "C" for confidential) |
| lastupdated | string | Yes | Last updated timestamp in YYYY-MM-DD format |

## Entity: MyinfoAddress

Represents the registered address with specific v5 nesting.

| Field | Type | Mandatory | Description |
|-------|------|-----------|-------------|
| type | string | Yes | Address type discriminator (e.g., "SG") |
| block | MyinfoValue<string> | No | Block number |
| street | MyinfoValue<string> | No | Street name |
| postal | MyinfoValue<string> | No | Postal code |
| country | { code: string, desc: string } | Yes | Country object with code and description |

## Entity: MyinfoFinance (Updated)

Includes detailed NOA and sorted CPF contributions.

| Field | Type | Mandatory | Description |
|-------|------|-----------|-------------|
| cpfcontributions | Array<MyinfoCpfContribution> | No | Sorted chronologically by Paid on -> For Month |
| noa | MyinfoNoaDetailed | No | Detailed NOA for the latest year |
| noahistory | Array<MyinfoNoaDetailed> | No | Detailed NOA for the last 2 years |

### Sub-Entity: MyinfoNoaDetailed

| Field | Type | Mandatory | Description |
|-------|------|-----------|-------------|
| amount | MyinfoValue<number> | Yes | Assessable income amount |
| yearofassessment | MyinfoValue<string> | Yes | Year of assessment (YYYY) |
| employment | MyinfoValue<number> | No | Income from employment |
| trade | MyinfoValue<number> | No | Income from trade |
| rent | MyinfoValue<number> | No | Income from rent |
| interest | MyinfoValue<number> | No | Income from interest |
| taxclearance | MyinfoValue<string> | No | Tax clearance indicator (Y/N) |
| taxcategory | MyinfoValue<string> | No | Type of income tax bill |

## Entity: MyinfoVehicle (Updated)

| Field | Type | Mandatory | Description |
|-------|------|-----------|-------------|
| vehicles | Array<MyinfoVehicleRecord> | No | Array of vehicle objects |

### Sub-Entity: MyinfoVehicleRecord

| Field | Type | Mandatory | Description |
|-------|------|-----------|-------------|
| vehicleno | MyinfoValue<string> | Yes | Vehicle registration number |
| type | MyinfoValue<string> | Yes | Vehicle type |
| make | MyinfoValue<string> | Yes | Vehicle make |
| model | MyinfoValue<string> | Yes | Vehicle model |

## Relationships

- **MyinfoPerson** HAS ONE **MyinfoAddress** (as `regadd`)
- **MyinfoPerson** HAS ONE **MyinfoFinance**
- **MyinfoPerson** HAS ONE **MyinfoVehicle**
- **MyinfoFinance** HAS MANY **MyinfoCpfContribution** (Ordered)
- **MyinfoVehicle** HAS MANY **MyinfoVehicleRecord**
