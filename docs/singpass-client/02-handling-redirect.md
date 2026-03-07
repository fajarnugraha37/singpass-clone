# Client Implementation: Handling the Redirect

## Overview
Once the Pushed Authorization Request (PAR) is successful, the client redirects the user's browser to the Singpass login page. After the user authenticates, Singpass redirects them back to the client's `redirect_uri`.

## Step 1: Redirecting the User to Singpass
Construct a URL pointing to the Singpass `authorization_endpoint` (e.g., `/auth`) using only two query parameters:
- `client_id`: Your app's Client ID.
- `request_uri`: The URI obtained from the PAR response.

Redirect the browser:
```http
HTTP/1.1 302 Found
Location: https://id.singpass.gov.sg/auth?client_id=YOUR_ID&request_uri=urn:ietf:params:oauth:request_uri:xxxxx
```

## Step 2: Receiving the Callback
The user completes login (QR/Password + 2FA) on the Singpass site. Singpass redirects them to your registered `redirect_uri`.

### Successful Callback
The URL will contain two query parameters:
- `code`: The authorization code (Base64url encoded).
- `state`: The state parameter you generated during PAR.

### Error Callback
The URL will contain error parameters instead of `code`:
- `error`: Error code (e.g., `server_error`, `temporarily_unavailable`).
- `error_description`: Human-readable description.
- `state`: The state parameter.

## Step 3: Validating the Callback (Crucial)
In your backend handler for the `redirect_uri`:
1. Check for `error`. If present, abort and show an appropriate error page. DO NOT reflect `error_description` verbatim to the user (Content Spoofing risk).
2. Retrieve the `state` parameter from the URL.
3. Compare the received `state` against the `state` you saved in the user's session during the PAR step.
   - **If they do not match, abort the transaction.** This protects against Cross-Site Request Forgery (CSRF).

If validation passes, you now have the `code` and can proceed to the Token Exchange.