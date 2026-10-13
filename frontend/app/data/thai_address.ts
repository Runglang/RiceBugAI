import thaiAddressData from './thai_address.json';

export type ThaiAddressStructure = Record<string, Record<string, string[]>>;

const typedData: ThaiAddressStructure = thaiAddressData;

export function getProvinces(): string[] {
  return Object.keys(typedData).sort((a, b) => a.localeCompare(b, 'th'));
}

export function getDistricts(province: string): string[] {
  if (!province || !typedData[province]) return [];
  return Object.keys(typedData[province]).sort((a, b) => a.localeCompare(b, 'th'));
}

export function getSubdistricts(province: string, district: string): string[] {
  if (!province || !district || !typedData[province] || !typedData[province][district]) return [];
  return [...typedData[province][district]].sort((a, b) => a.localeCompare(b, 'th'));
}

export default typedData;
