copyCopychevron-down

1.  [Products](/docs/products)chevron-right
2.  [square-infoSingpass Myinfo](/docs/products/singpass-myinfo)

# FAQ

Frequently Asked Questions about Myinfo

#### 

[hashtag](#q1.-what-are-the-benefits-of-upgrading-to-the-new-version-of-myinfo)

Q1. What are the benefits of upgrading to the new version of Myinfo?

The new version of Myinfo API improves the security posture of the API and data shared. It aligns to current industry and RFC standards, and improves operations flows for partners to minimise service disruption during key rotation.

* * *

#### 

[hashtag](#q2.-i-am-currently-using-myinfo-v3.-when-is-the-deadline-to-upgrade-to-myinfo-v4)

Q2. I am currently using Myinfo v3. When is the deadline to upgrade to Myinfo v4?

It is no longer mandatory for partners to migrate to Myinfo v4. All new onboardings will be to the new Myinfo.

1.  Partners on Myinfo v3/v4 will have till end Sep 2026 to migrate to Myinfo v5.
    
2.  Partners are expected to ensure that their apps are compliant with FAPI 2.0 by 31 December 2026.
    

* * *

#### 

[hashtag](#q3.-what-should-i-do-when-a-users-data-in-the-business-conflicts-with-the-users-data-retrieved-from)

Q3. What should I do when a user’s data in the business conflicts with the user’s data retrieved from Myinfo?

You should assess which dataset takes precedence, based on business or regulatory requirements and also factor in the following:

1.  Whether the data retrieved from government sources;
    
2.  Time-stamp of the data retrieved, to determine which is more recent.
    

* * *

#### 

[hashtag](#q4.-can-i-request-for-more-data-items-than-what-i-need-for-my-digital-service)

Q4. Can I request for more data items than what I need for my digital service?

No. You should only request for the data items that you need for your digital service. This is aligned with the guidelines of the Personal Data Protection Act, which instructs the collection of personal data in an appropriate manner for the circumstances. Each request will be reviewed prior to approval.

* * *

#### 

[hashtag](#q5.-i-would-like-to-linkup-multiple-digital-services-with-myinfo.-do-i-submit-a-single-request-for-a)

Q5. I would like to linkup multiple digital services with Myinfo. Do I submit a single request for all my digital services or one request for each digital service?

A new request must be submitted for digital services with different use cases/user journeys. If in doubt, please submit a request for every digital service.

* * *

#### 

[hashtag](#q6.-my-digital-service-saves-user-data-in-the-transaction-session-or-cookie.-if-the-user-closes-the)

Q6. My digital service saves user data in the transaction session or cookie. If the user closes the browser and comes back to the digital service again, can I populate the digital form using data saved in the session or cookie?

No. To prevent stale data from being mistaken as a Myinfo data, every user profile retrieved by a digital service must fetch new data from Myinfo.

* * *

#### 

[hashtag](#q7.-i-would-like-to-design-my-digital-service-to-depend-solely-on-myinfo-to-fill-up-a-form.-is-this)

Q7. I would like to design my digital service to depend solely on Myinfo to fill up a form. Is this a recommended approach?

Digital services should allow users to manually fill up forms to access digital services to accommodate the following scenarios:

1.  User does not wish to use Myinfo;
    
2.  If the user is a foreigner who does not have Myinfo or if the user does not have a Singpass account; or
    
3.  If the Myinfo service is temporarily unavailable (e.g. system maintenance).
    

* * *

#### 

[hashtag](#q8.-can-my-digital-service-retrieve-user-data-for-backend-processing-without-displaying-it-on-a-digi)

Q8. Can my digital service retrieve user data for backend processing without displaying it on a digital form?

No, all data retrieved from Myinfo have to be displayed on the digital form for verification by the user, prior to form submission.

* * *

#### 

[hashtag](#q9.-how-should-my-digital-service-handle-scenarios-where-the-user-finds-that-the-verified-data-retri)

Q9. How should my digital service handle scenarios where the user finds that the verified data retrieved from Myinfo is out-of-date? (e.g. user has not updated ICA about his/her change of registered address)

Businesses may allow users to fill out the form manually with the correct data. In this case, data previously retrieved from Myinfo should not be saved.

* * *

#### 

[hashtag](#q10.-are-the-registered-addresses-of-users-restricted-to-singapore-addresses)

Q10. Are the registered addresses of users restricted to Singapore addresses?

No, the registered address field can contain overseas addresses.

* * *

#### 

[hashtag](#q11.-my-digital-service-requires-only-the-last-three-months-of-the-users-cpf-contribution-history.-c)

Q11. My digital service requires only the last three months of the user’s CPF contribution history. Can my digital service only show the last three months of CPF contribution history?

The retrieval of CPF contribution history will return the last 15 months of the user’s CPF contribution. All 15 months of the contribution should be displayed on your digital service form.

* * *

#### 

[hashtag](#q12.-is-there-any-guideline-to-display-cpf-contribution-history-data)

Q12. Is there any guideline to display CPF contribution history data?

Digital services should adhere to the CPF Display Guidelines when retrieving and displaying CPF data: Click [herearrow-up-right](https://docs.developer.singpass.gov.sg/docs/products/myinfo/data-display-guidelines) to refer to the CPF display guidelines.

* * *

#### 

[hashtag](#q13.-i-have-some-issues-uploading-my-x.509-public-key-with-my-ios-device.-how-can-i-upload-my-x.509)

Q13. I have some issues uploading my X.509 public key with my iOS device. How can I upload my X.509 public key?

It is recommended to upload your X.509 public key using compatible browsers (e.g. Safari, Chrome, Firefox) on your desktop.

* * *

#### 

[hashtag](#q14.-i-have-been-given-a-corppass-account-by-my-corppass-administrator.-however-i-am-unable-to-login)

Q14. I have been given a CorpPass account by my CorpPass administrator. However, I am unable to login to the portal using the CorpPass account.

Please check with your CorpPass administrator to ensure your CorpPass account is given permission to access 'Singpass API Developer and Partner Portal'.

* * *

#### 

[hashtag](#q15.-what-is-the-estimated-turnaround-time-after-i-have-submitted-an-app-request)

Q15. What is the estimated turnaround time after I have submitted an app request?

We will respond to you in two weeks upon submission of your app request.

* * *

#### 

[hashtag](#q16.-what-is-the-estimated-turnaround-time-after-i-have-submitted-my-app-configurations)

Q16. What is the estimated turnaround time after I have submitted my app configurations?

Upon successful submission, your app configurations will take effect within 5 to 10 minutes.

* * *

#### 

[hashtag](#q17.-we-are-a-solution-company-looking-to-build-a-product-platform-integrated-with-myinfo-for-our-cl)

Q17. We are a solution company looking to build a product/platform integrated with Myinfo for our client. How do we go about doing so?

Please submit a joint link-up request through your client. You may refer to our portal for the on-boarding process.

* * *

#### 

[hashtag](#q18.-can-the-consent-page-be-customised-to-allow-users-to-select-fields-that-they-wish-to-retrieve-f)

Q18. Can the consent page be customised to allow users to select fields that they wish to retrieve from Myinfo?

To optimise the user experience for customers, users need to consent to share all data items relevant to a transaction. This allows a more seamless and secure user journey that minimises form-filling and document submission.

If users are uncomfortable with sharing any data items, they may opt to fill the form manually.

* * *

#### 

[hashtag](#q19.-can-foreigners-use-myinfo-to-transact-with-digital-services)

Q19. Can foreigners use Myinfo to transact with digital services?

Foreigners who have a valid Singpass account will have a Myinfo profile, and they can use the service.

* * *

#### 

[hashtag](#q20.-can-i-add-additional-data-item-s-to-my-app-after-it-has-been-submitted)

Q20. Can I add additional data item(s) to my app after it has been submitted?

You may add additional data item(s) to your app after the original request has been approved.

Please click on the 'Edit' button and under 'Scopes Selection' choose your additional data item(s) for your app.

A revised user journey should be submitted to reflect the additional data item(s), and the justification updated.

* * *

#### 

[hashtag](#q21.-what-are-the-charges-fees-for-using-myinfo-api)

Q21. What are the charges/fees for using Myinfo API?

Charges for using Myinfo API started from Apr 2022. Please log in with Singpass to view pricing table.

* * *

#### 

[hashtag](#q22.-i-am-a-financial-institution.-is-utilisation-of-ndi-services-subject-to-mas-expectations-under)

Q22. I am a financial institution. Is utilisation of NDI services subject to MAS’ expectations under the Guidelines on Outsourcing?

The Monetary Authority of Singapore (MAS) has issued a guidance to all financial institutions in June 2020. For outsourcing arrangements involving services which are wholly provided by the Government Technology Agency (GovTech) or agents appointed by GovTech, they will not be subject to the MAS Guidelines on Outsourcing. Please refer to the list of services [here](/docs/products/singpass-login).

* * *

#### 

[hashtag](#q23.-who-do-i-contact-if-i-require-more-details)

Q23. Who do I contact if I require more details?

If you have any other query, please submit a request at [partnersupport.singpass.gov.sgarrow-up-right](https://partnersupport.singpass.gov.sg/).

[PreviousScheduled Downtimeschevron-left](/docs/products/singpass-myinfo/scheduled-downtimes)[NextOverview of Singpasschevron-right](/docs/introduction/overview-of-singpass)

Last updated 25 days ago

Was this helpful?