import { freeResourcesDB } from "@/data/mock/database";
import { FreeResource } from "@/types";

// Mock DB for saved resources
export const savedResourcesDB: { id: string; studentId: string; resourceId: string; }[] = [
  { id: "sv1", studentId: "u4", resourceId: "fr1" }
];

export async function getPublishedFreeResources(): Promise<FreeResource[]> {
  return freeResourcesDB.filter(r => r.status === "PUBLISHED");
}

export async function toggleSaveResource(studentId: string, resourceId: string): Promise<boolean> {
  const existing = savedResourcesDB.find(sv => sv.studentId === studentId && sv.resourceId === resourceId);
  
  if (existing) {
    // Unsave
    const index = savedResourcesDB.indexOf(existing);
    savedResourcesDB.splice(index, 1);
    return false;
  } else {
    // Save
    savedResourcesDB.push({ id: `sv${Date.now()}`, studentId, resourceId });
    return true;
  }
}

export async function getSavedResources(studentId: string): Promise<FreeResource[]> {
  const savedIds = savedResourcesDB.filter(sv => sv.studentId === studentId).map(sv => sv.resourceId);
  return freeResourcesDB.filter(r => savedIds.includes(r.id));
}