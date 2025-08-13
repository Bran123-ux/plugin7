
// LEV System Design Types

export interface LEVComponent {
  id: string;
  type: 'extraction-point' | 'dust-collector' | 'fan' | 'bend' | 'reducer' | 'tee' | 'damper';
  name: string;
  x: number;
  y: number;
  flowRate: number; // m³/h
  diameter: number; // mm
  staticPressure?: number; // Pa
  material: string;
  hasBlastGate?: boolean;
  angle?: number; // for bends
  equipment?: {
    model: string;
    specifications: any;
    price: number;
  };
  selected?: boolean;
  connections?: string[]; // IDs of connected components
}

export interface LEVConnection {
  id: string;
  from: string;
  to: string;
  diameter: number;
  length: number;
  pressureLoss: number;
  velocity: number;
  points: { x: number; y: number }[];
}

export interface LEVSystem {
  id: string;
  name: string;
  components: LEVComponent[];
  connections: LEVConnection[];
  totalFlow: number;
  totalPressure: number;
  mainDuctSize: number;
  warnings: string[];
  calculations: {
    pressureLosses: PressureLoss[];
    fanSelection: FanSelection;
    ductSizing: DuctSizing;
  };
}

export interface PressureLoss {
  component: string;
  type: 'friction' | 'fitting' | 'bend' | 'expansion' | 'contraction';
  loss: number;
  velocity: number;
  diameter: number;
}

export interface FanSelection {
  requiredFlow: number;
  requiredPressure: number;
  recommendedFan: any;
  operatingPoint: { flow: number; pressure: number };
  efficiency: number;
}

export interface DuctSizing {
  mainDuct: number;
  branches: { [key: string]: number };
  velocities: { [key: string]: number };
}

export interface BOMItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  specifications?: string;
}

export interface MaterialProperties {
  type: string;
  displayName: string;
  minVelocity: number;
  maxVelocity: number;
  defaultFlow: number;
  density: number;
}

export interface IndustryPreset {
  name: string;
  type: string;
  components: Partial<LEVComponent>[];
  guidelines: {
    mainVelocity: number;
    branchVelocity: number;
    collectorOversizing: number;
  };
}

// Canvas and Drawing Types
export interface CanvasState {
  zoom: number;
  panX: number;
  panY: number;
  selectedTool: string | null;
  isDrawingConnection: boolean;
  connectionStart: string | null;
  gridSize: number;
  snapToGrid: boolean;
}

export interface DrawingPoint {
  x: number;
  y: number;
}

export interface CanvasRect {
  x: number;
  y: number;
  width: number;
  height: number;
}
