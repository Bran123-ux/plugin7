
import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const csvPath = path.join(process.cwd(), 'data', 'materials.csv');
    const csvContent = await fs.readFile(csvPath, 'utf-8');
    
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',');
    
    const materials = lines.slice(1).map(line => {
      const values = line.split(',');
      const material: any = {};
      
      headers.forEach((header, index) => {
        const key = header.trim();
        let value = values[index]?.trim() || '';
        
        // Parse numeric values
        if (key.includes('velocity') || key.includes('flow') || key.includes('density')) {
          material[key] = parseFloat(value) || 0;
        } else {
          material[key] = value;
        }
      });
      
      return material;
    });
    
    return NextResponse.json(materials);
  } catch (error) {
    console.error('Error loading materials:', error);
    return NextResponse.json([]);
  }
}
