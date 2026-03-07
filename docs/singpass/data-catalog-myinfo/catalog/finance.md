copyCopychevron-down

1.  [Data Catalog (Myinfo)](/docs/data-catalog-myinfo)chevron-right
2.  [book-openCatalog](/docs/data-catalog-myinfo/catalog)

# coinsFinance

id

name

description

Data Available

Source

cpfbalances.oa

CPF Balances - Ordinary Account

The Central Provident Fund is a mandatory social security savings scheme funded by contributions from employers and employees.

The CPF balance here would include Ordinary Account (OA).

Click [herearrow-up-right](https://docs.developer.singpass.gov.sg/docs/products/myinfo/data-display-guidelines) to refer to the CPF display guidelines.

SC,PR

CPFB

cpfbalances.ma

CPF Balances - Medisave Account

The Central Provident Fund is a mandatory social security savings scheme funded by contributions from employers and employees.

The CPF balance here would include Medisave Account (MA).

Click [herearrow-up-right](https://docs.developer.singpass.gov.sg/docs/products/myinfo/data-display-guidelines) to refer to the CPF display guidelines.

SC,PR

CPFB

cpfbalances.ra

CPF Balances - Retirement Account

The Central Provident Fund is a mandatory social security savings scheme funded by contributions from employers and employees.

The CPF balance here would include Retirement Account (RA) if applicable to the user.

Click [herearrow-up-right](https://docs.developer.singpass.gov.sg/docs/products/myinfo/data-display-guidelines) to refer to the CPF display guidelines.

SC,PR

CPFB

cpfbalances.sa

CPF Balances - Special Account

The Central Provident Fund is a mandatory social security savings scheme funded by contributions from employers and employees.

The CPF balance here would include Special Account (SA).

Click [herearrow-up-right](https://docs.developer.singpass.gov.sg/docs/products/myinfo/data-display-guidelines) to refer to the CPF display guidelines.

SC,PR

CPFB

cpfcontributions

CPF Contribution History (up to 15 months)

The Central Provident Fund is a mandatory social security savings scheme funded by contributions from employers and employees.

For each contribution record, the 4 fields (Paid for Month, Paid On, Employer Name, Contribution Total) will be provided.

Only Contribution(s) related to employment will be provided. Other contributions, such as self-employed or government top-ups, are presently excluded.

CPF will return the contributions received (or paid on) in the past 15 months up to the preceding month. Note that a member could have multiple contributions per month from the same employer.

**1\. Example 1:**

If the query is made in March-24, contribution provided will be for contribution received in the period from January-23 to March-24 (inclusive). This is provided that March-24 contribution had been received, else contribution provided will be January-23 to February-24.

**2\. Example 2:** Assuming a member has a late CPF contribution for work done in Nov-22 (beyond January-23 to March-24) that was credited only in Jan-23. If the query is made in March-24, contribution provided will include the late contribution as it was received in the period from January-23 to March-24. The contribution period range of January-23 to March-24 (inclusive) remains.

Click [herearrow-up-right](https://docs.developer.singpass.gov.sg/docs/products/myinfo/data-display-guidelines) to refer to the CPF display guidelines.

SC,PR

CPFB

cpfhousingwithdrawal

CPF Housing Withdrawal

The Central Provident Fund is a mandatory social security savings scheme funded by contributions from employers and employees.

The CPF Housing Withdrawal data include the following for the purpose of financing a HDB flat or private residential property:

a) Address: This is the registered address of property which withdrawal is made.

b) Principal Withdrawal Amount: This is the CPF principal amount user has withdrawn under the CPF housing schemes.

c) Monthly Instalment Amount: This is the monthly CPF deduction for payment of user's property.

d) Accrued Interest Amount: This is the interest that user would have earned had user's savings remained in the CPF account.

e) Total Amount of CPF Allowed for Property: The maximum CPF savings allowed to be used for the financing the property, excluding the amount used for stamp duty and legal fees.

Click [herearrow-up-right](https://docs.developer.singpass.gov.sg/docs/products/myinfo/data-display-guidelines) to refer to the CPF display guidelines.

SC,PR

CPFB

noa-basic

Notice of Assessment (Basic, Latest Year)

This refers to the taxpayer's total income after deducting allowable expenses and approved donations. Total income includes:

(i) Trade

(ii) Employment

(iii) Rent

(iv) Interest

This field will only return:

(i) 1 yearly assessable income and

(ii) the corresponding year value. The yearly assessable income will be the latest available income up to the last 2 Years of Assessments. If the subscriber does not have any assessment record for up to 2 back years, Myinfo will return the following:

a) Assessable Income= 'NA' or '-'

b) Year Assessed='NA'.

To note:

i. Assessable Income details is only available for finalised assessment. Thus, income information will not be available if the subscriber has a Default Assessment (e.g. taxpayers who have not submitted their tax return).

ii. This may not be applicable for foreigners depending on their tax residency. For example, in the case of double tax treaties with other countries, foreigner may not need to pay Singapore tax.

SC,PR,FIN

IRAS

noahistory-basic

Notice of Assessment (Basic, Last 2 Years)

Similar to 'Notice of Assessment (Basic, Latest Year)' data field, but for the last 2 years instead.

SC,PR,FIN

IRAS

noa

Notice of Assessment (Detailed, Latest Year)

Similar to 'Notice of Assessment (Basic, Latest Year)' data field, including the following income breakdown

a) Employment

b) Trade

c) Rent

d) Interest

Additional details in this data field:

a) Tax clearance : Indicator will be 'Y' for scenario where non-Singapore Citizen employee that ceases employment in Singapore, and goes on an overseas posting or plans to leave Singapore for more than three months. Only need to display this field if the value = 'Y'.

b) Tax Category : Type of Income Tax Bill. For more details, [click herearrow-up-right](https://www.iras.gov.sg/taxes/individual-income-tax/basics-of-individual-income-tax/receive-tax-bill-pay-tax-check-refunds/understanding-my-tax-assessment).

SC,PR,FIN

IRAS

noahistory

Notice of Assessment (Detailed, Last 2 Years)

Similar to 'Notice of Assessment (Basic, Latest Year)' data field, but for the last 2 years instead.

SC,PR,FIN

IRAS

ownerprivate

Ownership of Private Residential Property

This refers to the ownership of private residential property. Note that this does not include shophouses which are assessed as commercial properties.

This field will be 'Y', if the corresponding NRIC/FIN, in IRAS records, is a primarily, secondary or CC owner of an active private residential property and is required to pay property tax. Otherwise will be 'N'.

Where the NRIC/FIN is not found in IRAS records, it will be returned as 'NA'.

SC,PR

IRAS

cpfinvestmentscheme.account

CPF Investment Scheme - Account

The Central Provident Fund is a mandatory social security savings scheme funded by contributions from employers and employees.

CPF savings can be used in these investment schemes - CPF Investment Scheme (CPFIS) & Special Discounted Shares (SDS) Scheme.

CPFIS account data includes Agent Bank under CPFIS-OA and Investment Account number which refer to the CPF Investment account that user has opened with one of the CPFIS-OA agent banks under the CPFIS.

SC,PR

CPFB

cpfinvestmentscheme.sdsnetshareholdingqty

CPF Investment Scheme - Number of Discounted Singtel Shares

The Central Provident Fund is a mandatory social security savings scheme funded by contributions from employers and employees. CPF savings can be used in these investment schemes - CPF Investment Scheme (CPFIS) & Special Discounted Shares (SDS) Scheme. Number of Discounted Singtel Shares refers to the number of discounted Singtel shareholdings held under the SDS Scheme.

SC,PR

CPFB

cpfinvestmentscheme.saqparticipationstatus

CPF Investment Scheme - Self-Awareness Questionnaire (SAQ) Participation Status

The Central Provident Fund is a mandatory social security savings scheme funded by contributions from employers and employees.

CPF savings can be used in these investment schemes - CPF Investment Scheme (CPFIS) & Special Discounted Shares (SDS) Scheme.

Self-Awareness Questionnaire (SAQ) Participation Status refers to whether the user has taken the CPFIS Self-Awareness Questionnaire (SAQ) to help assess if CPFIS is suitable for the user.

SC,PR

CPFB

[PreviousPersonalchevron-left](/docs/data-catalog-myinfo/catalog/personal)[NextEducation and Employmentchevron-right](/docs/data-catalog-myinfo/catalog/education-and-employment)

Last updated 10 months ago

Was this helpful?