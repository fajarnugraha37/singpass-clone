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
 * Creates an empty MyinfoPerson structure with explicit nulls for all fields.
 * This ensures compliance with the requirement of returning explicit nulls
 * instead of omitting keys.
 */
export function createEmptyMyinfoPerson(userId: string): MyinfoPerson {
  return {
    userId,
    // Personal Catalog
    uinfin: { value: null },
    partialuinfin: { value: null },
    name: { value: null },
    aliasname: { value: null },
    hanyupinyinname: { value: null },
    hanyupinyinaliasname: { value: null },
    marriedname: { value: null },
    sex: { value: null },
    race: { value: null },
    secondaryrace: { value: null },
    dialect: { value: null },
    dob: { value: null },
    residentialstatus: { value: null },
    nationality: { value: null },
    birthcountry: { value: null },
    passportnumber: { value: null },
    passportexpirydate: { value: null },
    passtype: { value: null },
    passstatus: { value: null },
    passexpirydate: { value: null },
    employmentsector: { value: null },
    mobileno: {
      prefix: { value: null },
      areacode: { value: null },
      nbr: { value: null },
    },
    email: { value: null },
    regadd: {
      type: { value: null },
      block: { value: null },
      building: { value: null },
      floor: { value: null },
      unit: { value: null },
      street: { value: null },
      postal: { value: null },
      country: { value: null },
    },
    hdbtype: { value: null },
    housingtype: { value: null },

    // Other catalogs are partials but should be initialized for complete response
    finance: {
      'cpfbalances.oa': { value: null },
      'cpfbalances.ma': { value: null },
      'cpfbalances.ra': { value: null },
      'cpfbalances.sa': { value: null },
      cpfcontributions: [],
      'noa-basic': {
        amount: { value: null },
        yearofassessment: { value: null },
      },
      ownerprivate: { value: null },
    },
    education: {
      employment: { value: null },
      occupation: { value: null },
    },
    family: {
      marital: { value: null },
      marriagedate: { value: null },
      childrenbirthrecords: [],
    },
    vehicle: {
      vehicleno: { value: null },
      type: { value: null },
      make: { value: null },
      model: { value: null },
    },
    drivingLicence: {
      qdl: {
        validity: { value: null },
        expirydate: { value: null },
        classes: [],
      },
    },
    property: {
      hdbownership: [],
    },
    governmentScheme: {
      pioneergen: {
        eligibility: { value: null },
      },
      merdekagen: {
        eligibility: { value: null },
      },
      chas: {
        eligibility: { value: null },
      },
    },
  };
}
