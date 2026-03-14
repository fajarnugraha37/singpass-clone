# Data Model: Secure JWKS Export

This feature does not introduce any new persistent data models.

It modifies the serialization of the **JSON Web Key (JWK)** entity for public exposure. The in-memory representation of the key may contain private components, but the data model for the public-facing `/.well-known/keys` endpoint is being corrected to strictly adhere to a public-only schema.
