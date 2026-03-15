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
    vehicle, 
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
        // Special handling for property or other complex arrays if needed
        // But the domain entity already follows the { value: ... } wrapping
        // for individual attributes. Arrays like cpfcontributions or hdbownership
        // are returned as arrays of objects.
        personInfo[key] = val;
      }
    }
  };

  mergeCatalog(finance);
  mergeCatalog(education);
  mergeCatalog(family);
  mergeCatalog(vehicle);
  mergeCatalog(drivingLicence);
  mergeCatalog(property);
  mergeCatalog(governmentScheme);

  return personInfo;
}
