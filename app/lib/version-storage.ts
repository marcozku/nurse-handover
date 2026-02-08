'use client';

export interface PatientData {
  age?: string;
  gender?: string;
  complaints?: string;
  investigation?: string;
  management?: string;
  consultations?: string;
  results?: string;
  pendingDischarge?: boolean;
  drugAllergy?: string;
  privateMedications?: string;
}

export interface VersionEntry {
  id: string;
  bedNumber: number;
  data: PatientData;
  nurseName: string;
  shift: string;
  timestamp: string;
  changeType: 'created' | 'updated';
}

const VERSION_HISTORY_KEY = 'bed-versions-';

/**
 * Get version history for a bed
 */
export function getBedVersions(bedNumber: number): VersionEntry[] {
  const key = `${VERSION_HISTORY_KEY}${bedNumber}`;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

/**
 * Save a new version entry
 */
export function saveVersionEntry(
  bedNumber: number,
  data: PatientData,
  nurseName: string,
  shift: string,
  changeType: 'created' | 'updated'
) {
  const versions = getBedVersions(bedNumber);

  const newEntry: VersionEntry = {
    id: `${bedNumber}-${Date.now()}`,
    bedNumber,
    data: { ...data },
    nurseName,
    shift,
    timestamp: new Date().toISOString(),
    changeType,
  };

  // Keep only last 50 versions
  const updatedVersions = [newEntry, ...versions].slice(0, 50);

  const key = `${VERSION_HISTORY_KEY}${bedNumber}`;
  localStorage.setItem(key, JSON.stringify(updatedVersions));
}

/**
 * Clear version history for a bed
 */
export function clearBedVersions(bedNumber: number) {
  const key = `${VERSION_HISTORY_KEY}${bedNumber}`;
  localStorage.removeItem(key);
}
