import { NextRequest, NextResponse } from 'next/server';
import { PatientService } from '@/app/lib/patient-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { bed: string } }
) {
  try {
    const data = await PatientService.getBedData(params.bed);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching bed data:', error);
    return NextResponse.json({ error: 'Failed to fetch bed data' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { bed: string } }
) {
  try {
    const body = await request.json();
    const { data, nurseName, shift } = body;

    const patient = await PatientService.saveBedData(
      params.bed,
      data,
      nurseName || 'Unknown',
      shift || 'AM'
    );

    return NextResponse.json({ success: true, patient });
  } catch (error) {
    console.error('Error saving bed data:', error);
    return NextResponse.json({ error: 'Failed to save bed data' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { bed: string } }
) {
  try {
    await PatientService.clearBedData(params.bed);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing bed data:', error);
    return NextResponse.json({ error: 'Failed to clear bed data' }, { status: 500 });
  }
}
