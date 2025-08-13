
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { projectId, bomItems } = data;

    // Delete existing BOM items for this project
    await prisma.bOMItem.deleteMany({
      where: { project_id: projectId }
    });

    // Create new BOM items
    const createdItems = await Promise.all(
      bomItems.map((item: any) =>
        prisma.bOMItem.create({
          data: {
            project_id: projectId,
            item_name: item.name,
            category: item.category,
            quantity: item.quantity,
            unit: item.unit,
            unit_price_gbp: item.unitPrice,
            total_price_gbp: item.totalPrice,
            specifications: item.specifications,
            notes: item.notes
          }
        })
      )
    );

    return NextResponse.json(createdItems);
  } catch (error) {
    console.error('BOM creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create BOM' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    const bomItems = await prisma.bOMItem.findMany({
      where: { project_id: projectId },
      orderBy: { created_at: 'asc' }
    });

    return NextResponse.json(bomItems);
  } catch (error) {
    console.error('BOM fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch BOM' },
      { status: 500 }
    );
  }
}
