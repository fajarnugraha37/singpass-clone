copyCopychevron-down

1.  [Data Catalog (Myinfo)](/docs/data-catalog-myinfo)chevron-right
2.  [book-openCatalog](/docs/data-catalog-myinfo/catalog)

# userPersonal

id

name

description

Data Available

Source

uinfin

NRIC/FIN

NRIC number or FIN of user. NRIC number is the unique identifier given to every Singapore Citizens (SC) and Permanent Residents (PR), while FIN is the unique identifier for Foreigners.

SC,PR,FIN

ICA/MOM

partialuinfin

Partial NRIC/FIN

Last 3 numerical digits and checksum of the NRIC/FIN number, prefixed with '\*\*\*\*\*' (e.g. "\*\*\*\*\*567A" from the full NRIC number of "S1234567A").

SC,PR,FIN

\-

name

Principal Name

Full name of user printed on NRIC or FIN card. Includes Surname if any.

SC,PR,FIN

ICA/MOM

aliasname

Alias Name

Refers to an alternate/additional name of the user that is legally recognised.

SC,PR

ICA

hanyupinyinname

Hanyu Pinyin Name

Refers to the officially romanised Chinese name of the user.

SC,PR

ICA

hanyupinyinaliasname

Hanyu Pinyin Alias Name

Refers to the legally-recognised alternate officially romanised Chinese name of the user.

SC,PR

ICA

marriedname

Married Name

Refers to the family name or surname adopted by the user upon marriage.

SC,PR

ICA

sex

Sex

Gender of the user. Refer to [Code Listingarrow-up-right](https://public.cloud.myinfo.gov.sg/dpp/frontend/assets/api-lib/myinfo/downloads/myinfo-api-code-tables.xlsx) (SexCode) for list of possible values.

SC,PR,FIN

ICA/MOM

race

Race

Refer to [Code Listingarrow-up-right](https://public.cloud.myinfo.gov.sg/dpp/frontend/assets/api-lib/myinfo/downloads/myinfo-api-code-tables.xlsx) (RaceCode) for list of possible values.

SC,PR,FIN

ICA/MOM

secondaryrace

Secondary Race

Refers to secondary racial category of the Person, if any.

Refer to [Code Listingarrow-up-right](https://public.cloud.myinfo.gov.sg/dpp/frontend/assets/api-lib/myinfo/downloads/myinfo-api-code-tables.xlsx) (RaceCode) for list of possible values.

SC,PR

ICA

dialect

Dialect

Refer to [Code Listingarrow-up-right](https://public.cloud.myinfo.gov.sg/dpp/frontend/assets/api-lib/myinfo/downloads/myinfo-api-code-tables.xlsx) (DialectCode) for list of possible values.

SC,PR

ICA

dob

Date of Birth

SC,PR,FIN

ICA/MOM

residentialstatus

Residential Status

Indicate if the user is a Citizen, PR or others. Blank value will be returned for FIN holder. Refer to [Code Listingarrow-up-right](https://public.cloud.myinfo.gov.sg/dpp/frontend/assets/api-lib/myinfo/downloads/myinfo-api-code-tables.xlsx) (ResidentialCode) for list of possible values.

SC,PR

ICA

nationality

Nationality/Citizenship

Refer to [Code Listingarrow-up-right](https://public.cloud.myinfo.gov.sg/dpp/frontend/assets/api-lib/myinfo/downloads/myinfo-api-code-tables.xlsx) (NationalityCitizenshipCode) for list of possible values.

SC,PR,FIN

ICA/MOM

birthcountry

Country/Place of Birth

Refer to [Code Listingarrow-up-right](https://public.cloud.myinfo.gov.sg/dpp/frontend/assets/api-lib/myinfo/downloads/myinfo-api-code-tables.xlsx) (CountryPlaceCode) for list of possible values.

SC,PR,FIN

ICA/MOM

passportnumber

Passport Number

SC

ICA

passportexpirydate

Passport Expiry Date

SC

ICA

passtype

Pass Type

This refers to the pass type of a FIN holder.

Refer to [Code Listingarrow-up-right](https://public.cloud.myinfo.gov.sg/dpp/frontend/assets/api-lib/myinfo/downloads/myinfo-api-code-tables.xlsx) (PassTypeCode) for list of possible values.

Note that this only applies to a FIN holder with a valid pass issued by ICA/MOM.

FIN

ICA/MOM

passstatus

Pass Status

This refers to the pass status of a FIN holder.

Available values:

*   Live
    
*   Approved. (Interim status in which the FIN holder has yet to receive the pass)
    

Note that this only applies to a FIN holder with a valid pass issued by ICA/MOM.

FIN

ICA/MOM

passexpirydate

Pass Expiry Date

This refers to the pass expiry date of a FIN holder.

Note that this only applies to a FIN holder with a valid pass issued by ICA/MOM.

FIN

ICA/MOM

employmentsector

Employment Sector

This refers to the employment sector of a FIN holder.

Note that this only applies to a FIN holder with a valid pass issued by MOM.

FIN

MOM

mobileno

Mobile Number

Mobile number must be made editable at digital services even though data source is Singpass.

SC,PR,FIN

Singpass

email

Email Address

Email address must be made editable at digital services even though data source is Singpass.

SC,PR,FIN

Singpass

regadd

Registered Address

For SC/PR - Registered address is the address that is printed on the NRIC card.

For FIN - Registered address is applicable for foreigners under the following Pass Types: **ICA-issued Passes** - Long Term Visit Pass / Long Term Visit Pass + - Student Pass - Immigration Exemption Order **MOM-issued Passes** - S Pass - Employment Pass - Personalised Employment Pass - EntrePass - Dependent Pass

SC,PR,FIN

ICA/MOM

hdbtype

Type of HDB

Note that this is determined based on user's Registered Address (if it is a HDB flat). It therefore has no association with HDB ownership.

Refer to [Code Listingarrow-up-right](https://public.cloud.myinfo.gov.sg/dpp/frontend/assets/api-lib/myinfo/downloads/myinfo-api-code-tables.xlsx) (HDBTypeCode) for list of possible values.

SC,PR,FIN

HDB

housingtype

Type of Housing

Note that this is determined based on user's Registered Address (if it is not a HDB flat). It has no association with housing ownership.

Refer to [Code Listing arrow-up-right](https://public.cloud.myinfo.gov.sg/dpp/frontend/assets/api-lib/myinfo/downloads/myinfo-api-code-tables.xlsx)(HousingTypeCode) for list of possible values.

SC,PR,FIN

URA

[PreviousCatalogchevron-left](/docs/data-catalog-myinfo/catalog)[NextFinancechevron-right](/docs/data-catalog-myinfo/catalog/finance)

Last updated 25 days ago

Was this helpful?