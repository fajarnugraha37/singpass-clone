copyCopychevron-down

1.  [Technical Specifications](/docs/technical-specifications)chevron-right
2.  [(Legacy) Pre-FAPI 2.0 API Specifications](/docs/technical-specifications/singpass-authentication-api)chevron-right
3.  [3\. Userinfo Endpoint](/docs/technical-specifications/singpass-authentication-api/3.-userinfo-endpoint)

# Validating the payload

triangle-exclamation

All Login and Myinfo apps must follow Singpass' [FAPI 2.0-compliant authentication API](/docs/technical-specifications/integration-guide) by 31 Dec 2026.

The specifications on this page apply to you only if you are maintaining an existing Login / Myinfo (v5) integration. We encourage you to [migrate](/docs/technical-specifications/migration-guides/login-myinfo-v5-apps) early to avoid service disruptions.

As mentioned in [the introduction](/docs/technical-specifications/singpass-authentication-api/3.-userinfo-endpoint), the response returned from the GET `/userinfo` endpoint will be a [JWS within the payload of a JWE token](/docs/technical-specifications/singpass-authentication-api/2.-token-endpoint/authorization-code-grant#overview-of-a-jws-in-jwe).

For example, the response typically returns the following JWE token:

Copy

```
eyJjdHkiOiJKV1QiLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIiwiYWxnIjoiRUNESC1FUytBMjU2S1ciLCJraWQiOiJ0ZXN0LXJwLWtleS0wMSIsImVwayI6eyJrdHkiOiJFQyIsImNydiI6IlAtMjU2IiwieCI6Ik1RVTBWRnlfUWFUYktzTmJrVTdMZkFnUjJ2Y1FQYW94UzBXM2RLRm9yOU0iLCJ5IjoibkdRam5PRlZ4emdzRERjMUJqQ3otZi1KeUY4VC14WW0xQVp4NjFtZWVCOCJ9fQ.gDvjBmkLqQ42hbNM2ULPwaskGPBlLvslPAqr0XcN2a-OYqOHXKfwvoUUOuoibTfzg_l8rr-WalvY8FY_a8yfHOaL2GLt6ZWj.O_tgtrTbPRbL_p0Y2rvnCQ.38npNWj1nL1AQxS2A3JrxokxHms6GPYT2OFhaFghI7N0QkR48gPuUvKi-m7wPbESTYA-9O-bSHEX9fUXD4FtlztrhjRTpGmdfppooVMn9_bHcLLyHbHnS3_yW5JaybqHNfD6zXCB1pw24vvHfGmRJ7C86CeBgosuYslMk7y7m_rIT6YhVnotN_kRBOppVW9eC3g0upRxXQJ3O10__pR-QcBb_eXKqwm6tcpeTEqBPl0Dbedk6DDoq6KSRV5LzyFLMutAjInQpKGdWYa7FCgfHL3FWNfcwyPq27s3d14ArZJVkIJsOW_VTI_lrnSBzCcdJpbGj9wPe0e2SfslliZlSxYTTpECyV5AZZgwxz0pMaE85Ob7KzrJjMdbZqZZC53HnZmq6pS8RiUce4950IwvsfF0xDUDaZuMxKnISoPcuUX2jHr8FG0SytO8Pr6m3DyOYbQnSkUFdjCRSHiKRqDxlqM15hSkle3jtd9qf-EzuGeHNqaJCjD7XWeviwJgD70fUZDM8lDvCp5mTfl0pcy7mlGEWjVmfR3MB1ohGwkZLeq3H_KrCyhn_FJ-DRPiE4oIaO8oSsFOhRocND4RDlliOIRK_B1XRmw1YpJFBRpn04N2ytnJrxCJ4cZeTEa4QCYkKaJHPqWkN_qvdgxywkwELLB5Tb1sgdKcq3Kh77uHWl7AfZF9iE1L-kgg4hT5KaJSp4qEYz-nbb4TqmrsnZiPbjnzSFrOGZ778OpDWnXhbb5VcXk9ZjejEdBtoqnIJ_vubEWTw-ZeMI4fCmNuiZ4HnY130VKfnU2f19GSNYaeL7GX7bVQWVS_H01mbll6_GUe.g7la6rSFevvuUrEoqVb41SQB1dk4JuTkrl8zwE0fzG4
```

After decrypting the JWE token, the resultant payload contains a JWS token that looks like this:

Copy

```
eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImFsaWFzL3N0Zy1zcC1hdXRoLWFwaS1pZC10b2tlbi1zaWduaW5nLWtleS1rbXMtYXN5bW1ldHJpYy1rZXktYWxpYXMifQ.eyJ1aW5maW4iOnsibGFzdHVwZGF0ZWQiOiIyMDI0LTA5LTI2Iiwic291cmNlIjoiMSIsImNsYXNzaWZpY2F0aW9uIjoiQyIsInZhbHVlIjoiUzkwMDAwMDFCIn0sIm5hbWUiOnsibGFzdHVwZGF0ZWQiOiIyMDI0LTA5LTI2Iiwic291cmNlIjoiMSIsImNsYXNzaWZpY2F0aW9uIjoiQyIsInZhbHVlIjoiU09IIEhBTyBGRU5HIn0sImJpcnRoY291bnRyeSI6eyJsYXN0dXBkYXRlZCI6IjIwMjQtMDktMjYiLCJjb2RlIjoiU0ciLCJzb3VyY2UiOiIxIiwiY2xhc3NpZmljYXRpb24iOiJDIiwiZGVzYyI6IlNJTkdBUE9SRSJ9LCJkaWFsZWN0Ijp7Imxhc3R1cGRhdGVkIjoiMjAyNC0wOS0yNiIsImNvZGUiOiJUQyIsInNvdXJjZSI6IjEiLCJjbGFzc2lmaWNhdGlvbiI6IkMiLCJkZXNjIjoiVEVPQ0hFVyJ9LCJkb2IiOnsibGFzdHVwZGF0ZWQiOiIyMDI0LTA5LTI2Iiwic291cmNlIjoiMSIsImNsYXNzaWZpY2F0aW9uIjoiQyIsInZhbHVlIjoiMTk4OS0wNy0wOSJ9LCJoYW55dXBpbnlpbm5hbWUiOnsibGFzdHVwZGF0ZWQiOiIyMDI0LTA5LTI2Iiwic291cmNlIjoiMSIsImNsYXNzaWZpY2F0aW9uIjoiQyIsInZhbHVlIjoiIn0sIm5hdGlvbmFsaXR5Ijp7Imxhc3R1cGRhdGVkIjoiMjAyNC0wOS0yNiIsImNvZGUiOiJTRyIsInNvdXJjZSI6IjEiLCJjbGFzc2lmaWNhdGlvbiI6IkMiLCJkZXNjIjoiU0lOR0FQT1JFIENJVElaRU4ifSwicGFzc3BvcnRleHBpcnlkYXRlIjp7Imxhc3R1cGRhdGVkIjoiMjAyNC0wOS0yNiIsInNvdXJjZSI6IjEiLCJjbGFzc2lmaWNhdGlvbiI6IkMiLCJ2YWx1ZSI6IjE5MzMtMDgtMDgifSwicGFzc3BvcnRudW1iZXIiOnsibGFzdHVwZGF0ZWQiOiIyMDI0LTA5LTI2Iiwic291cmNlIjoiMSIsImNsYXNzaWZpY2F0aW9uIjoiQyIsInZhbHVlIjoiRTc4OTg1NjFDIn0sInJhY2UiOnsibGFzdHVwZGF0ZWQiOiIyMDI0LTA5LTI2IiwiY29kZSI6IkNOIiwic291cmNlIjoiMSIsImNsYXNzaWZpY2F0aW9uIjoiQyIsImRlc2MiOiJDSElORVNFIn0sInJlc2lkZW50aWFsc3RhdHVzIjp7Imxhc3R1cGRhdGVkIjoiMjAyNC0wOS0yNiIsImNvZGUiOiJDIiwic291cmNlIjoiMSIsImNsYXNzaWZpY2F0aW9uIjoiQyIsImRlc2MiOiJDSVRJWkVOIn0sInNlY29uZGFyeXJhY2UiOnsibGFzdHVwZGF0ZWQiOiIyMDI0LTA5LTI2IiwiY29kZSI6IiIsInNvdXJjZSI6IjEiLCJjbGFzc2lmaWNhdGlvbiI6IkMiLCJkZXNjIjoiIn0sInNleCI6eyJsYXN0dXBkYXRlZCI6IjIwMjQtMDktMjYiLCJjb2RlIjoiTSIsInNvdXJjZSI6IjEiLCJjbGFzc2lmaWNhdGlvbiI6IkMiLCJkZXNjIjoiTUFMRSJ9LCJpc3MiOiJodHRwczovL3N0Zy1pZC5zaW5ncGFzcy5nb3Yuc2ciLCJzdWIiOiJzPVM5MDAwMDAxQix1PWQ0NWQ4ZjIxLTYxNzgtNDcxMy1iOTYyLTg2MzVlZDJhOTQ1YSIsImF1ZCI6InRXVDNyZkltbjloQ2V6bExyME0xblJVdlE0MGZDTkw0IiwiaWF0IjoxNzQ2Njc4MDg5fQ.Tmvh5V_BN0fMBgqa2-Z4vG_Ayp_OoeWfyQrWMZjG9y9NBFwyRnjMpwDK_qFzkn_0D7AjOX-np6p3Nk5KFwvKiA
```

Where the payload (if the following scopes: `uinfin` and `name` were requested) is:

Copy

```
{
  "uinfin": {
    "lastupdated": "2024-09-26",
    "source": "1",
    "classification": "C",
    "value": "S9000001B"
  },
  "name": {
    "lastupdated": "2024-09-26",
    "source": "1",
    "classification": "C",
    "value": "SOH HAO FENG"
  },
  // above scopes are returned in the same format as the Myinfo Get Person response
  "iss": "https://stg-id.singpass.gov.sg",
  "sub": "s=S9000001B,u=d45d8f21-6178-4713-b962-8635ed2a945a",
  "aud": "tWT3rfImn9hCezlLr0M1nRUvQ40fCNL4",
  "iat": 1746678089
}
```

circle-check

Please note that currently the structure of the payload follows the existing [Myinfo Get Person responsearrow-up-right](https://public.cloud.myinfo.gov.sg/myinfo/api/myinfo-kyc-v4.0.html#operation/getperson) – along with `iss`, `sub`, `aud`, `iat`. You can expand the toggle below for the full list.

chevron-rightMyinfo get-person sample response[hashtag](#myinfo-get-person-sample-response)

[PreviousRequesting Userinfochevron-left](/docs/technical-specifications/singpass-authentication-api/3.-userinfo-endpoint/requesting-userinfo)[Next.well-known Endpointschevron-right](/docs/technical-specifications/singpass-authentication-api/.well-known-endpoints)

Last updated 24 days ago

Was this helpful?