copyCopychevron-down

1.  [Products](/docs/products)chevron-right
2.  [square-infoSingpass Myinfo](/docs/products/singpass-myinfo)

# Data Display Guidelines

This is for CPF Account Balance, Principal Name and NOA (Detailed)

The following provides a set of display guidelines for businesses with digital services consuming CPF, Principal Name and Notice of Assessment (Detailed) data to adhere to, in order to present the respective data in an accurate and consistent manner.

#### 

[hashtag](#cpf-account-balances)

CPF Account Balances

* * *

There are 4 types of CPF accounts and their respective balances are available via Myinfo:

*   Ordinary Account (OA)
    
*   Special Account (SA)
    
*   Medisave Account (MA)
    
*   Retirement Account (RA)
    

CPF data are retrieved real-time (as at the point of retrieval). Organizations whose digital services are obtaining CPF balances via Myinfo, will need to take note of the following points when designing the display of CPF balances in their digital services.

![](https://docs.developer.singpass.gov.sg/docs/~gitbook/image?url=https%3A%2F%2F2816701917-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252FW3T7d7fy7OGYkZf4zVKU%252Fuploads%252FXjnoe4WI2RZUlrTU4ptI%252Fimage.png%3Falt%3Dmedia%26token%3D375890e0-079c-4bf1-813f-ad84283603ac&width=768&dpr=3&quality=100&sign=67af67c0&sv=2)

Example 1: CPF member has OA, SA and MA only

![](https://docs.developer.singpass.gov.sg/docs/~gitbook/image?url=https%3A%2F%2F2816701917-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252FW3T7d7fy7OGYkZf4zVKU%252Fuploads%252FIIFZswx8pGSNNYjDp40N%252Fimage.png%3Falt%3Dmedia%26token%3D26cb353b-4a5a-4bdb-bd80-bd00a358fd6b&width=768&dpr=3&quality=100&sign=579286a4&sv=2)

Example 2: CPF member with OA, SA, MA and RA

![](https://docs.developer.singpass.gov.sg/docs/~gitbook/image?url=https%3A%2F%2F2816701917-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252FW3T7d7fy7OGYkZf4zVKU%252Fuploads%252FalJDBtFj9nKtagqp8T24%252Fimage.png%3Falt%3Dmedia%26token%3Df3cc5de4-44f8-4966-8700-f5a414d02c14&width=768&dpr=3&quality=100&sign=d8e93351&sv=2)

* * *

#### 

[hashtag](#employment-related-cpf-contribution-history)

Employment Related CPF Contribution History

Organisations whose digital services are consuming employment related CPF Contribution History via Myinfo, will need to take note of the following points when designing the display of CPF contributions in their digital services. CPF data are retrieved real-time (as at the point of retrieval).

![](https://docs.developer.singpass.gov.sg/docs/~gitbook/image?url=https%3A%2F%2F2816701917-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252FW3T7d7fy7OGYkZf4zVKU%252Fuploads%252FRFnOL3fek3VQ4PtkXWg2%252Fimage.png%3Falt%3Dmedia%26token%3Dddeadd24-21b9-4d16-bcb6-a1af0bd5d38b&width=768&dpr=3&quality=100&sign=e3657c71&sv=2)

Please take note that:

*   The contribution entries are to be sorted by "Paid on" followed by "For Month", in ascending values.
    
*   Myinfo service covers commonly required CPF contribution, i.e. employment related contributions. Non-employment related contribution (e.g. government top-up, self-employed contributions) are not available in Myinfo.
    

Example 1: CPF member has OA, SA and MA only

![](https://docs.developer.singpass.gov.sg/docs/~gitbook/image?url=https%3A%2F%2F2816701917-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252FW3T7d7fy7OGYkZf4zVKU%252Fuploads%252Fw5GfSkFYOIhczAccqK4W%252Fimage.png%3Falt%3Dmedia%26token%3Dd930164d-2a60-4108-a2ca-5207cc126ca5&width=768&dpr=3&quality=100&sign=8146e9be&sv=2)

* * *

#### 

[hashtag](#principal-name)

Principal Name

Businesses that are capturing customer's name in multiple fields (e.g. First, Middle and Last Name) must take note of the following points:

*   Principal Name field must still be displayed in non-editable mode.
    
*   Multiple name fields (e.g. First, Middle, and Last Name) will be displayed in editable mode.
    
*   It is in businesses interest that the final submitted multiple name fields does not substantially differ with the Principal Name.
    

* * *

#### 

[hashtag](#notice-of-assessment-detailed)

Notice of Assessment (Detailed)

Businesses with digital services consuming Notice of Assessment (Detailed, Last Year) or Notice of Assessment (Detailed, Last 2 Years) must take note of the following points:

*   All detailed fields in the Notice of Assessment should be displayed.
    
*   Year of Assessment, Type and Tax Clearance (if applicable), Assessable Income and Income Breakdown must be displayed clearly.
    
*   When Tax Clearance = Y, the word 'Clearance' must be displayed after the Type field.
    

Businesses must adhere to the guideline in order to present the respective Notice of Assessment data in an accurate and consistent manner to Tax Payer.

Examples of Notice of Assessment (Detailed, Last 2 Years) display:

![](https://docs.developer.singpass.gov.sg/docs/~gitbook/image?url=https%3A%2F%2F2816701917-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252FW3T7d7fy7OGYkZf4zVKU%252Fuploads%252F6yShCJm6lpEs76JUBj4f%252Fimage.png%3Falt%3Dmedia%26token%3D40ef1d3d-1f13-401b-b679-994ce8e39a82&width=768&dpr=3&quality=100&sign=e8049220&sv=2)

[PreviousLogo Download and Brand Guidelineschevron-left](/docs/products/singpass-myinfo/logo-download-and-brand-guidelines)[NextScheduled Downtimeschevron-right](/docs/products/singpass-myinfo/scheduled-downtimes)

Last updated 25 days ago

Was this helpful?