
import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const csvPath = path.join(process.cwd(), 'data', 'presets.csv');
    const csvContent = await fs.readFile(csvPath, 'utf-8');
    
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',');
    
    const presets = lines.slice(1).map(line => {
      const values = line.split(',');
      const preset: any = {};
      
      headers.forEach((header, index) => {
        const key = header.trim();
        let value = values[index]?.trim() || '';
        
        // Parse JSON arrays for industry and typical_components
        if (key === 'industry' || key === 'typical_components') {
          try {
            preset[key] = JSON.parse(value.replace(/'/g, '"'));
          } catch (e) {
            preset[key] = [];
          }
        } else {
          preset[key] = value;
        }
      });
      
      return preset;
    });
    
    return NextResponse.json(presets);
  } catch (error) {
    console.error('Error loading presets:', error);
    return NextResponse.json([]);
  }
}
