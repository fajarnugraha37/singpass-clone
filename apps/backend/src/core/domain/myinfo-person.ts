import { 
  MyinfoPersonal,
  MyinfoFinance,
  MyinfoEducation,
  MyinfoFamily,
  MyinfoVehicle,
  MyinfoDrivingLicence,
  MyinfoProperty,
  MyinfoGovernmentScheme
} from '@vibe/shared/index';

/**
 * Domain entity for Myinfo Person data.
 * This entity groups catalogs into nested objects to align with internal 
 * logical grouping before being flattened by the mapper.
 */
export interface MyinfoPerson extends MyinfoPersonal {
  userId: string;
  finance: MyinfoFinance;
  education: MyinfoEducation;
  family: MyinfoFamily;
  vehicle: MyinfoVehicle;
  drivingLicence: MyinfoDrivingLicence;
  property: MyinfoProperty;
  governmentScheme: MyinfoGovernmentScheme;
}

/**
 * Helper to wrap a value with standard Myinfo v5 metadata.
 */
function withMeta<T>(value: T | null, source: string = '1'): { value: T | null, source: string, classification: string, lastupdated: string } {
  return {
    value,
    source,
    classification: 'C',
    lastupdated: '2024-03-18'
  };
}

/**
 * Creates an empty MyinfoPerson structure with explicit nulls for all fields.
 * This ensures compliance with the requirement of returning explicit nulls
 * instead of omitting keys.
 */
export function createEmptyMyinfoPerson(userId: string): MyinfoPerson {
  return {
    userId,
    // Personal Catalog
    uinfin: withMeta(null),
    partialuinfin: withMeta(null),
    name: withMeta(null),
    aliasname: withMeta(null),
    hanyupinyinname: withMeta(null),
    hanyupinyinaliasname: withMeta(null),
    marriedname: withMeta(null),
    sex: withMeta(null),
    race: withMeta(null),
    secondaryrace: withMeta(null),
    dialect: withMeta(null),
    dob: withMeta(null),
    residentialstatus: withMeta(null),
    nationality: withMeta(null),
    birthcountry: withMeta(null),
    passportnumber: withMeta(null),
    passportexpirydate: withMeta(null),
    passtype: withMeta(null),
    passstatus: withMeta(null),
    passexpirydate: withMeta(null),
    employmentsector: withMeta(null),
    mobileno: {
      prefix: withMeta(null, '4'),
      areacode: withMeta(null, '4'),
      nbr: withMeta(null, '4'),
    },
    email: withMeta(null, '4'),
    regadd: {
      type: withMeta(null),
      block: withMeta(null),
      building: withMeta(null),
      floor: withMeta(null),
      unit: withMeta(null),
      street: withMeta(null),
      postal: withMeta(null),
      country: withMeta(null),
    },
    hdbtype: withMeta(null),
    housingtype: withMeta(null),

    // Other catalogs are partials but should be initialized for complete response
    finance: {
      'cpfbalances.oa': withMeta(null),
      'cpfbalances.ma': withMeta(null),
      'cpfbalances.ra': withMeta(null),
      'cpfbalances.sa': withMeta(null),
      cpfcontributions: [],
      'noa-basic': {
        amount: withMeta(null),
        yearofassessment: withMeta(null),
      },
      ownerprivate: withMeta(null),
    },
    education: {
      employment: withMeta(null),
      occupation: withMeta(null),
    },
    family: {
      marital: withMeta(null),
      marriagedate: withMeta(null),
      childrenbirthrecords: [],
    },
    vehicle: {
      vehicleno: withMeta(null),
      type: withMeta(null),
      make: withMeta(null),
      model: withMeta(null),
    },
    drivingLicence: {
      qdl: {
        validity: withMeta(null),
        expirydate: withMeta(null),
        classes: [],
      },
    },
    property: {
      hdbownership: [],
    },
    governmentScheme: {
      pioneergen: {
        eligibility: withMeta(null),
      },
      merdekagen: {
        eligibility: withMeta(null),
      },
      chas: {
        eligibility: withMeta(null),
      },
    },
  };
}
