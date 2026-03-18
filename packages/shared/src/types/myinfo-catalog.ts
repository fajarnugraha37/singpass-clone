export interface MyinfoValue<T> {
  value: T | null;
  source: string;
  classification: string;
  lastupdated: string;
}

export interface MyinfoAddress {
  type: string;
  block: MyinfoValue<string>;
  building: MyinfoValue<string>;
  floor: MyinfoValue<string>;
  unit: MyinfoValue<string>;
  street: MyinfoValue<string>;
  postal: MyinfoValue<string>;
  country: {
    code: string;
    desc: string;
  };
}

export interface MyinfoMobileNo {
  prefix: MyinfoValue<string>;
  areacode: MyinfoValue<string>;
  nbr: MyinfoValue<string>;
}

export interface MyinfoPersonal {
  uinfin: MyinfoValue<string>;
  partialuinfin: MyinfoValue<string>;
  name: MyinfoValue<string>;
  aliasname: MyinfoValue<string>;
  hanyupinyinname: MyinfoValue<string>;
  hanyupinyinaliasname: MyinfoValue<string>;
  marriedname: MyinfoValue<string>;
  sex: MyinfoValue<string>;
  race: MyinfoValue<string>;
  secondaryrace: MyinfoValue<string>;
  dialect: MyinfoValue<string>;
  dob: MyinfoValue<string>;
  residentialstatus: MyinfoValue<string>;
  nationality: MyinfoValue<string>;
  birthcountry: MyinfoValue<string>;
  passportnumber: MyinfoValue<string>;
  passportexpirydate: MyinfoValue<string>;
  passtype: MyinfoValue<string>;
  passstatus: MyinfoValue<string>;
  passexpirydate: MyinfoValue<string>;
  employmentsector: MyinfoValue<string>;
  mobileno: MyinfoMobileNo;
  email: MyinfoValue<string>;
  regadd: MyinfoAddress;
  hdbtype: MyinfoValue<string>;
  housingtype: MyinfoValue<string>;
}

export interface MyinfoCpfContribution {
  date: MyinfoValue<string>;
  amount: MyinfoValue<number>;
  employer: MyinfoValue<string>;
  month: MyinfoValue<string>;
}

export interface MyinfoNoaDetailed {
  amount: MyinfoValue<number>;
  yearofassessment: MyinfoValue<string>;
  employment: MyinfoValue<number>;
  trade: MyinfoValue<number>;
  rent: MyinfoValue<number>;
  interest: MyinfoValue<number>;
  taxclearance: MyinfoValue<string>;
  taxcategory: MyinfoValue<string>;
}

export interface MyinfoFinance {
  'cpfbalances.oa': MyinfoValue<number>;
  'cpfbalances.ma': MyinfoValue<number>;
  'cpfbalances.ra': MyinfoValue<number>;
  'cpfbalances.sa': MyinfoValue<number>;
  cpfcontributions: MyinfoCpfContribution[];
  'noa-basic': {
    amount: MyinfoValue<number>;
    yearofassessment: MyinfoValue<string>;
  };
  noa: MyinfoNoaDetailed;
  noahistory: MyinfoNoaDetailed[];
  ownerprivate: MyinfoValue<string>;
}

export interface MyinfoEducation {
  employment: MyinfoValue<string>;
  occupation: MyinfoValue<string>;
  academicqualifications: {
    qualification: MyinfoValue<string>;
    school: MyinfoValue<string>;
    yearofgraduation: MyinfoValue<string>;
  }[];
  ltavocationallicences: {
    licence: MyinfoValue<string>;
    validity: MyinfoValue<string>;
    expirydate: MyinfoValue<string>;
  }[];
}

export interface MyinfoChildBirthRecord {
  birthcertno: MyinfoValue<string>;
  name: MyinfoValue<string>;
  dob: MyinfoValue<string>;
  sex: MyinfoValue<string>;
  lifestatus: MyinfoValue<string>;
}

export interface MyinfoFamily {
  marital: MyinfoValue<string>;
  marriagedate: MyinfoValue<string>;
  childrenbirthrecords: MyinfoChildBirthRecord[];
}

export interface MyinfoVehicleRecord {
  vehicleno: MyinfoValue<string>;
  type: MyinfoValue<string>;
  make: MyinfoValue<string>;
  model: MyinfoValue<string>;
}

export interface MyinfoDrivingLicence {
  qdl: {
    validity: MyinfoValue<string>;
    expirydate: MyinfoValue<string>;
    classes: MyinfoValue<string>[];
  };
}

export interface MyinfoProperty {
  hdbownership: {
    noofowners: MyinfoValue<number>;
    address: MyinfoAddress;
    hdbtype: MyinfoValue<string>;
    leasecommencementdate: MyinfoValue<string>;
  }[];
}

export interface MyinfoGovernmentScheme {
  pioneergen: {
    eligibility: MyinfoValue<boolean>;
  };
  merdekagen: {
    eligibility: MyinfoValue<boolean>;
  };
  chas: {
    eligibility: MyinfoValue<boolean>;
  };
}

export interface MyinfoCatalog {
  personal: MyinfoPersonal;
  finance: MyinfoFinance;
  education: MyinfoEducation;
  family: MyinfoFamily;
  vehicles: MyinfoVehicleRecord[];
  drivingLicence: MyinfoDrivingLicence;
  property: MyinfoProperty;
  governmentScheme: MyinfoGovernmentScheme;
}

export type MyinfoPerson = MyinfoPersonal & 
  Partial<MyinfoFinance> & 
  Partial<MyinfoEducation> & 
  Partial<MyinfoFamily> & 
  { vehicles?: MyinfoVehicleRecord[] } & 
  Partial<MyinfoDrivingLicence> & 
  Partial<MyinfoProperty> & 
  Partial<MyinfoGovernmentScheme>;
