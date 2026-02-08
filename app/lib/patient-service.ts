import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let prisma: PrismaClient;

if (process.env.DATABASE_URL) {
  // Production mode with connection pooling
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });
} else {
  // Development mode without adapter
  prisma = globalForPrisma.prisma ?? new PrismaClient({
    log: ['error', 'warn'],
  });
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisa = prisma;

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

export class PatientService {
  /**
   * Save or update patient data for a bed
   */
  static async saveBedData(
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
        await this.createPatientVersion(patient, data, nurseName, shift, 'updated');

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
        await this.createPatientVersion(patient, data, nurseName, shift, 'created');
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
        await this.createHandoverVersion(handover, data, nurseName, shift, 'updated');

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

        await this.createHandoverVersion(handover, data, nurseName, shift, 'created');
      }

      return patient;
    } catch (error) {
      console.error('Error in saveBedData:', error);
      throw error;
    }
  }

  /**
   * Get patient data for a bed
   */
  static async getBedData(bedNumber: string): Promise<PatientData | null> {
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
   * Get version history for a bed
   */
  static async getBedVersions(bedNumber: string) {
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
   * Create patient version record
   */
  private static async createPatientVersion(
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
   * Create handover version record
   */
  private static async createHandoverVersion(
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

  /**
   * Clear all data for a bed
   */
  static async clearBedData(bedNumber: string) {
    try {
      const patient = await prisma.patient.findFirst({
        where: { bedNumber },
      });

      if (!patient) return;

      // Create version before deleting
      await this.createPatientVersion(
        patient,
        {},
        'System',
        'Unknown',
        'deleted'
      );

      // Delete patient (cascade will delete medications, handovers, versions)
      await prisma.patient.delete({
        where: { id: patient.id },
      });
    } catch (error) {
      console.error('Error in clearBedData:', error);
      throw error;
    }
  }

  /**
   * Get all beds data for a team
   */
  static async getTeamBedsData(team: number) {
    try {
      const teamBeds: Record<number, number[]> = {
        1: [1, 2, 3, 4, 5, 6, 7, 8, 41, 42, 48, 49],
        2: [9, 10, 11, 12, 13, 14, 15, 16, 31, 32, 33, 34],
        3: [17, 18, 19, 20, 21, 22, 23, 35, 37, 38, 39, 40, 43],
        4: [24, 25, 26, 27, 28, 29, 30, 36, 44, 45, 46, 47],
      };

      const beds = teamBeds[team];
      const result: Record<number, PatientData> = {};

      for (const bed of beds) {
        const data = await this.getBedData(bed.toString());
        if (data) {
          result[bed] = data;
        }
      }

      return result;
    } catch (error) {
      console.error('Error in getTeamBedsData:', error);
      return {};
    }
  }
}
