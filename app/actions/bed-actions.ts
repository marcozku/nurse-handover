'use server';

import { prisma } from './patient-service';

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

/**
 * Server Action: Get bed data
 */
export async function getBedData(bedNumber: string) {
  try {
    const patient = await prisma.patient.findFirst({
      where: { bedNumber },
      include: { medications: true },
    });

    if (!patient) return null;

    const latestHandover = await prisma.handover.findFirst({
      where: { patientId: patient.id },
      orderBy: { date: 'desc' },
    });

    const privateMed = patient.medications.find((m) => m.isPrivate);

    return {
      age: patient.age?.toString() || '',
      gender: patient.gender || '',
      complaints: patient.diagnosis || latestHandover?.assessment || '',
      investigation: '',
      management: latestHandover?.plan || '',
      consultations: latestHandover?.concerns || '',
      results: '',
      pendingDischarge: false,
      drugAllergy: patient.allergies?.join(', ') || '',
      privateMedications: privateMed?.name || '',
    };
  } catch (error) {
    console.error('Error in getBedData:', error);
    return null;
  }
}

/**
 * Server Action: Save bed data
 */
export async function saveBedData(
  bedNumber: string,
  data: PatientData,
  nurseName: string,
  shift: string
) {
  try {
    // Find existing patient for this bed
    let patient = await prisma.patient.findFirst({
      where: { bedNumber },
      include: { medications: true },
    });

    if (patient) {
      // Create version history before updating
      await createPatientVersion(patient, data, nurseName, shift, 'updated');

      // Update patient
      patient = await prisma.patient.update({
        where: { id: patient.id },
        data: {
          name: `Bed ${bedNumber}`,
          age: data.age ? parseInt(data.age) : null,
          gender: data.gender || null,
          diagnosis: data.complaints || null,
          allergies: data.drugAllergy ? [data.drugAllergy] : [],
        },
        include: { medications: true },
      });

      // Update or create private medication
      if (data.privateMedications) {
        const existingMed = patient.medications.find((m) => m.isPrivate);
        if (existingMed) {
          await prisma.medication.update({
            where: { id: existingMed.id },
            data: {
              name: data.privateMedications,
              isPrivate: true,
            },
          });
        } else {
          await prisma.medication.create({
            data: {
              patientId: patient.id,
              name: data.privateMedications,
              isPrivate: true,
            },
          });
        }
      }
    } else {
      // Create new patient
      patient = await prisma.patient.create({
        data: {
          name: `Bed ${bedNumber}`,
          bedNumber,
          age: data.age ? parseInt(data.age) : null,
          gender: data.gender || null,
          diagnosis: data.complaints || null,
          allergies: data.drugAllergy ? [data.drugAllergy] : [],
          medications: data.privateMedications
            ? {
                create: {
                  name: data.privateMedications,
                  isPrivate: true,
                },
              }
            : undefined,
        },
        include: { medications: true },
      });

      // Create initial version
      await createPatientVersion(patient, data, nurseName, shift, 'created');
    }

    // Create or update handover
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let handover = await prisma.handover.findFirst({
      where: {
        patientId: patient.id,
        date: {
          gte: today,
        },
      },
    });

    if (handover) {
      await createHandoverVersion(handover, data, nurseName, shift, 'updated');

      handover = await prisma.handover.update({
        where: { id: handover.id },
        data: {
          assessment: data.complaints || null,
          plan: data.management || null,
          concerns: data.consultations || null,
          nurseTo: nurseName,
        },
      });
    } else {
      handover = await prisma.handover.create({
        data: {
          patientId: patient.id,
          shift,
          date: new Date(),
          assessment: data.complaints || null,
          plan: data.management || null,
          concerns: data.consultations || null,
          nurseTo: nurseName,
        },
      });

      await createHandoverVersion(handover, data, nurseName, shift, 'created');
    }

    return { success: true, patient };
  } catch (error) {
    console.error('Error in saveBedData:', error);
    return { success: false, error: 'Failed to save bed data' };
  }
}

/**
 * Server Action: Get bed versions
 */
export async function getBedVersions(bedNumber: string) {
  try {
    const patient = await prisma.patient.findFirst({
      where: { bedNumber },
    });

    if (!patient) return [];

    const versions = await prisma.patientVersion.findMany({
      where: { patientId: patient.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return versions.map((v) => ({
      id: v.id,
      shift: v.shift,
      changedBy: v.changedBy,
      changeType: v.changeType,
      changes: v.changes,
      data: v.data,
      createdAt: v.createdAt,
    }));
  } catch (error) {
    console.error('Error in getBedVersions:', error);
    return [];
  }
}

/**
 * Server Action: Clear bed data
 */
export async function clearBedData(bedNumber: string) {
  try {
    const patient = await prisma.patient.findFirst({
      where: { bedNumber },
    });

    if (!patient) return { success: true };

    // Create version before deleting
    await createPatientVersion(patient, {}, 'System', 'Unknown', 'deleted');

    // Delete patient (cascade will delete medications, handovers, versions)
    await prisma.patient.delete({
      where: { id: patient.id },
    });

    return { success: true };
  } catch (error) {
    console.error('Error in clearBedData:', error);
    return { success: false, error: 'Failed to clear bed data' };
  }
}

/**
 * Helper: Create patient version record
 */
async function createPatientVersion(
  patient: any,
  newData: PatientData,
  nurseName: string,
  shift: string,
  changeType: 'created' | 'updated' | 'deleted'
) {
  try {
    const oldData = {
      age: patient.age,
      gender: patient.gender,
      diagnosis: patient.diagnosis,
      allergies: patient.allergies,
      privateMedications: patient.medications?.find((m: any) => m.isPrivate)?.name || null,
    };

    const changes = {
      age: oldData.age !== (newData.age ? parseInt(newData.age) : null),
      gender: oldData.gender !== newData.gender,
      diagnosis: oldData.diagnosis !== newData.complaints,
      allergies: oldData.allergies?.join(', ') !== newData.drugAllergy,
    };

    await prisma.patientVersion.create({
      data: {
        patientId: patient.id,
        data: {
          ...oldData,
          ...newData,
        },
        shift,
        changedBy: nurseName,
        changeType,
        changes,
      },
    });
  } catch (error) {
    console.error('Error in createPatientVersion:', error);
  }
}

/**
 * Helper: Create handover version record
 */
async function createHandoverVersion(
  handover: any,
  newData: PatientData,
  nurseName: string,
  shift: string,
  changeType: 'created' | 'updated' | 'deleted'
) {
  try {
    const oldData = {
      assessment: handover.assessment,
      plan: handover.plan,
      concerns: handover.concerns,
    };

    const changes = {
      assessment: oldData.assessment !== newData.complaints,
      plan: oldData.plan !== newData.management,
      concerns: oldData.concerns !== newData.consultations,
    };

    await prisma.handoverVersion.create({
      data: {
        handoverId: handover.id,
        data: {
          ...oldData,
          ...newData,
        },
        shift,
        changedBy: nurseName,
        changeType,
        changes,
      },
    });
  } catch (error) {
    console.error('Error in createHandoverVersion:', error);
  }
}
