# Quickstart: Userinfo Singpass Catalog

## Development Setup

1. **Database Setup**
   Ensure your database is generated and migrated to include the new mock user structure.
   ```bash
   cd apps/backend
   bun run db:generate
   bun run db:migrate
   ```

2. **Seeding Mock Users**
   Run the database seed script to populate mock users with full Myinfo catalog data and the default password `test1234`.
   ```bash
   bun run db:seed
   ```

3. **Running the Server**
   Start the backend and frontend development servers.
   ```bash
   bun run dev
   ```

## Testing the Userinfo Endpoint

1. **Obtain an Access Token**
   Perform a normal OIDC flow (or run test scripts) to obtain a DPoP-bound access token for a test user.

2. **Call the Endpoint**
   Make a GET request to the `/userinfo` endpoint with the valid DPoP proof and Authorization headers.

   ```bash
   curl -H "Authorization: DPoP <access_token>" \
        -H "DPoP: <dpop_proof_jwt>" \
        http://localhost:3000/userinfo
   ```

3. **Verify the Response**
   Ensure the returned `application/jwt` string can be successfully decrypted and decoded, and contains the `person_info` object with the expected wrapped fields and explicit `null` values for missing data.