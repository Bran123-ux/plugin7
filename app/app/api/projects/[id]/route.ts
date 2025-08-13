
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const project = await prisma.lEVProject.findUnique({
      where: { id: params.id },
      include: {
        bom_items: true
      }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Project fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    
    const project = await prisma.lEVProject.update({
      where: { id: params.id },
      data: {
        name: data.name,
        client_name: data.client_name,
        units: data.units,
        air_density: data.air_density,
        temperature: data.temperature,
        altitude: data.altitude,
        safety_margin: data.safety_margin,
        project_data: data.project_data,
        updated_at: new Date()
      }
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error('Project update error:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.lEVProject.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Project deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
