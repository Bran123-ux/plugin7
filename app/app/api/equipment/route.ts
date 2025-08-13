
import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Load ducting equipment
    const ductingPath = path.join(process.cwd(), 'data', 'ducting_equipment.csv');
    const ductingContent = await fs.readFile(ductingPath, 'utf-8');
    
    const ductingLines = ductingContent.trim().split('\n');
    const ductingHeaders = ductingLines[0].split(',');
    
    const ducting = ductingLines.slice(1).map(line => {
      const values = line.split(',');
      const item: any = {};
      
      ductingHeaders.forEach((header, index) => {
        const key = header.trim();
        let value = values[index]?.trim() || '';
        
        // Parse numeric values
        if (key.includes('diameter') || key.includes('price')) {
          item[key] = parseFloat(value) || 0;
        } else {
          item[key] = value;
        }
      });
      
      return item;
    });
    
    // Load extraction equipment
    const extractionPath = path.join(process.cwd(), 'data', 'extraction_equipment.csv');
    const extractionContent = await fs.readFile(extractionPath, 'utf-8');
    
    const extractionLines = extractionContent.trim().split('\n');
    const extractionHeaders = extractionLines[0].split(',');
    
    const extraction = extractionLines.slice(1).map(line => {
      const values = line.split(',');
      const item: any = {};
      
      extractionHeaders.forEach((header, index) => {
        const key = header.trim();
        let value = values[index]?.trim() || '';
        
        // Parse numeric values
        if (key.includes('airflow') || key.includes('power') || key.includes('price')) {
          item[key] = parseFloat(value) || 0;
        } else {
          item[key] = value;
        }
      });
      
      return item;
    });
    
    return NextResponse.json({
      ducting,
      extraction
    });
  } catch (error) {
    console.error('Error loading equipment:', error);
    return NextResponse.json({ ducting: [], extraction: [] });
  }
}
