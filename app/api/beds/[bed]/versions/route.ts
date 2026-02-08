import { NextRequest, NextResponse } from 'next/server';
import { PatientService } from '@/app/lib/patient-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { bed: string } }
) {
  try {
    const versions = await PatientService.getBedVersions(params.bed);
    return NextResponse.json(versions);
  } catch (error) {
    console.error('Error fetching bed versions:', error);
    return NextResponse.json({ error: 'Failed to fetch version history' }, { status: 500 });
  }
}
