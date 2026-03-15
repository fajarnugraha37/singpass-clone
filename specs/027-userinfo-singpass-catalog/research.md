# Research: Singpass Myinfo Userinfo Catalog Alignment

## Myinfo V5 Catalog Implementation Strategy

**Decision**: Implement all 7 Myinfo Catalogs exactly as documented in the local `docs/singpass/data-catalog-myinfo/catalog` markdown files, maintaining the `{"value": "..."}` nested structure for individual fields as required by the MyInfo standard payload format.

**Rationale**: The specification mandates full implementation of the catalogs. The Singpass Authentication API documentation specifies that the `person_info` claim must contain fields wrapped in a `value` object.

**Alternatives considered**: 
- *Schema-driven dynamic loading*: Rejected per user decision in favor of full implementation in the domain model.
- *Representative subset*: Rejected per user decision.

## Handling Missing User Data

**Decision**: Return explicit `null` values for catalog fields where the user lacks data, or omit them, but since the clarification explicitly chose "Return explicit null values", the API will output `{"value": null}` or a flat `null` depending on the exact Myinfo V5 specific schema requirements (defaulting to returning the field key with a null value or `{ "value": null }`).

**Rationale**: The specification explicitly clarified that missing data should be represented via explicit `null` values.

**Alternatives considered**:
- *Omitting keys*: Rejected per user decision during clarification.

## Seeding Mock Data

**Decision**: Manage and seed mock user data directly into the SQLite database using Drizzle ORM seed scripts.

**Rationale**: Chosen during the clarification phase. This aligns well with the existing Hexagonal Architecture backend using Drizzle ORM and allows deterministic test setups.

**Alternatives considered**:
- *Static JSON files loaded on startup*: Rejected per user decision.
- *Hardcoded memory objects*: Rejected per user decision.