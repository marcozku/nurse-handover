import { NextRequest, NextResponse } from 'next/server';
import { PatientService } from '@/app/lib/patient-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { team: string } }
) {
  try {
    const data = await PatientService.getTeamBedsData(parseInt(params.team));
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching team data:', error);
    return NextResponse.json({ error: 'Failed to fetch team data' }, { status: 500 });
  }
}
