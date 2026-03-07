copyCopychevron-down

1.  [Products](/docs/products)chevron-right
2.  [square-infoSingpass Myinfo](/docs/products/singpass-myinfo)

# Scheduled Downtimes

Due to the scheduled downtimes of Myinfo upstream systems, financial data from CPF Board and IRAS, and FIN user data from MOM are unavailable via Myinfo, Myinfo business, Verify and SGFinDex API at the following times:

*   **CPFB**
    
    *   Every Sunday 0500hrs to 0530hrs
        
    *   Every 1st Sun of the month from 0000hrs to 0800hrs
        
    *   Every 4th Sun of the month from 0000hrs to 0800hrs
        
    *   If the 1st or the 2nd day of the month falls on the 1st Sun, the maintenance will be on the 2nd and 4th Sun instead.
        
    
*   **IRAS**
    
    *   Every Wed, 0200hrs to 0600hrs
        
    *   Every Sun, 0200hrs to 0830hrs
        
    
*   **MOM**
    
    *   Every 4th Sun of the month from 0000hrs to 0600hrs
        
    

* * *

### 

[hashtag](#what-to-expect-during-downtime)

What to Expect During Downtime

During these maintenance periods, users will encounter an error response when attempting to retrieve the affected data. No data will be returned.

The specific error response that partners will receive will differ depending on their client version.

The error response for Myinfo v3/v4 clients is:

Copy

```
{
"statusCode": 500,
"message": "Internal server error - 540"
}
```

For Myinfo v5 clients, you will receive an error of status code 502, with the following response body:

Partners are expected to handle the above error responses in their internal systems and display a corresponding user-friendly error message to their end-users. This ensures a smooth user experience even during downtimes.

Please note that Myinfo, Myinfo Business, and Verify APIs will remain available for all other data items not affected by the maintenance.

Similarly, SGFinDex services will be unable to retrieve government-related data (from CPF and IRAS) during these times. However, SGFinDex will still be available for non-government data from financial institutions.

[PreviousData Display Guidelineschevron-left](/docs/products/singpass-myinfo/data-display-guidelines)[NextFAQchevron-right](/docs/products/singpass-myinfo/faq)

Last updated 25 days ago

Was this helpful?