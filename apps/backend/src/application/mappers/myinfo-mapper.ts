import { MyinfoPerson } from '../../core/domain/myinfo-person';

/**
 * Maps a MyinfoPerson domain entity to the person_info structure
 * as specified in the Singpass Myinfo v5 specification.
 * Each field is wrapped in a { value: T } object.
 */
export function mapMyinfoProfile(person: MyinfoPerson) {
  // Extract non-catalog fields (userId is internal, other catalog domains are nested)
  const { 
    userId, 
    finance, 
    education, 
    family, 
    vehicles, 
    drivingLicence, 
    property, 
    governmentScheme, 
    ...personal 
  } = person;

  // person_info in Myinfo v5 is a flat map of attributes
  const personInfo: Record<string, any> = { ...personal };

  // Helper to merge nested catalog domains into the flat personInfo object
  const mergeCatalog = (catalog: any) => {
    if (catalog) {
      for (const [key, val] of Object.entries(catalog)) {
        personInfo[key] = val;
      }
    }
  };

  mergeCatalog(finance);
  mergeCatalog(education);
  mergeCatalog(family);
  mergeCatalog(drivingLicence);
  mergeCatalog(property);
  mergeCatalog(governmentScheme);

  // Vehicles is a separate top-level field in person_info
  if (vehicles) {
    personInfo.vehicles = vehicles;
  }

  return personInfo;
}
