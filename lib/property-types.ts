// Property types will be used to categorize properties in the system. Each property type 
// will have a unique ID and a label that describes the type of property. This will help landlords 
// and tenants easily identify and filter properties based on their type. 
// TODO: Change when we have a database to store property types and fetch them dynamically.
export const PROPERTY_TYPES = [
  { id: 1, label: "House" },
  { id: 2, label: "Duplex" },
  { id: 3, label: "Apartment" },
  { id: 4, label: "Condo" },
  { id: 5, label: "Townhouse" },
];