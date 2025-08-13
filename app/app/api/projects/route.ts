
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const projects = await prisma.lEVProject.findMany({
      orderBy: { updated_at: 'desc' },
      include: {
        bom_items: true
      }
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Projects API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    const project = await prisma.lEVProject.create({
      data: {
        name: data.name,
        client_name: data.client_name,
        units: data.units || 'metric',
        air_density: data.air_density || 1.2,
        temperature: data.temperature || 20,
        altitude: data.altitude || 0,
        safety_margin: data.safety_margin || 1.1,
        project_data: data.project_data
      }
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error('Project creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
