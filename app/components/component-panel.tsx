
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LEVComponent, MaterialProperties } from '@/lib/types';
import { 
  Wrench, 
  Cog, 
  Flame, 
  CircleDot, 
  Square, 
  Wind, 
  Filter, 
  Fan, 
  RotateCw,
  ChevronRight,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ComponentPanelProps {
  onAddComponent: (component: Partial<LEVComponent>) => void;
  currentMaterial: string;
  materials: { [key: string]: MaterialProperties };
}

interface ComponentType {
  type: LEVComponent['type'];
  name: string;
  icon: React.ReactNode;
  defaultFlow: number;
  description: string;
  color: string;
}

interface PresetSystem {
  name: string;
  description: string;
  components: Partial<LEVComponent>[];
  icon: React.ReactNode;
}

export function ComponentPanel({ onAddComponent, currentMaterial, materials }: ComponentPanelProps) {
  const [presets, setPresets] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any>({ ducting: [], extraction: [] });

  useEffect(() => {
    loadPresets();
    loadEquipment();
  }, []);

  const loadPresets = async () => {
    try {
      const response = await fetch('/api/presets');
      if (response.ok) {
        const data = await response.json();
        setPresets(data);
      }
    } catch (error) {
      console.error('Failed to load presets:', error);
    }
  };

  const loadEquipment = async () => {
    try {
      const response = await fetch('/api/equipment');
      if (response.ok) {
        const data = await response.json();
        setEquipment(data);
      }
    } catch (error) {
      console.error('Failed to load equipment:', error);
    }
  };

  const extractionPoints: ComponentType[] = [
    {
      type: 'extraction-point',
      name: 'Table Saw',
      icon: <Wrench className="h-5 w-5" />,
      defaultFlow: materials[currentMaterial]?.defaultFlow || 500,
      description: 'Dust collection at table saw',
      color: 'text-blue-600'
    },
    {
      type: 'extraction-point',
      name: 'Lathe',
      icon: <Cog className="h-5 w-5" />,
      defaultFlow: materials[currentMaterial]?.defaultFlow || 400,
      description: 'Wood turning lathe extraction',
      color: 'text-green-600'
    },
    {
      type: 'extraction-point',
      name: 'Welding Station',
      icon: <Flame className="h-5 w-5" />,
      defaultFlow: 200,
      description: 'Welding fume extraction',
      color: 'text-red-600'
    },
    {
      type: 'extraction-point',
      name: 'Grinder',
      icon: <CircleDot className="h-5 w-5" />,
      defaultFlow: 350,
      description: 'Grinding station extraction',
      color: 'text-purple-600'
    },
    {
      type: 'extraction-point',
      name: 'Sander',
      icon: <Square className="h-5 w-5" />,
      defaultFlow: 400,
      description: 'Belt/disc sander extraction',
      color: 'text-yellow-600'
    },
    // New extraction arm options
    {
      type: 'extraction-point',
      name: 'Extraction Arm 2m',
      icon: <Wind className="h-5 w-5" />,
      defaultFlow: 300,
      description: '160mm dia, 2m reach extraction arm',
      color: 'text-indigo-600'
    },
    {
      type: 'extraction-point',
      name: 'Extraction Arm 3m',
      icon: <Wind className="h-5 w-5" />,
      defaultFlow: 350,
      description: '160mm dia, 3m reach extraction arm',
      color: 'text-indigo-600'
    },
    {
      type: 'extraction-point',
      name: 'Extraction Arm 4m',
      icon: <Wind className="h-5 w-5" />,
      defaultFlow: 400,
      description: '160mm dia, 4m reach extraction arm',
      color: 'text-indigo-600'
    },
    {
      type: 'extraction-point',
      name: 'Extraction Arm 5m',
      icon: <Wind className="h-5 w-5" />,
      defaultFlow: 450,
      description: '160mm dia, 5m reach extraction arm',
      color: 'text-indigo-600'
    },
    {
      type: 'extraction-point',
      name: 'Extraction Arm 7m',
      icon: <Wind className="h-5 w-5" />,
      defaultFlow: 550,
      description: '160mm dia, 7m reach extraction arm',
      color: 'text-indigo-600'
    },
    {
      type: 'extraction-point',
      name: 'Extraction Arm 9m',
      icon: <Wind className="h-5 w-5" />,
      defaultFlow: 650,
      description: '160mm dia, 9m reach extraction arm',
      color: 'text-indigo-600'
    },
    // Hose reel options
    {
      type: 'extraction-point',
      name: 'Hose Reel 8m',
      icon: <RotateCw className="h-5 w-5" />,
      defaultFlow: 280,
      description: '125mm dia, 8m hose reel',
      color: 'text-teal-600'
    },
    {
      type: 'extraction-point',
      name: 'Hose Reel 10m',
      icon: <RotateCw className="h-5 w-5" />,
      defaultFlow: 320,
      description: '125mm dia, 10m hose reel',
      color: 'text-teal-600'
    },
    {
      type: 'extraction-point',
      name: 'Hose Reel 12m',
      icon: <RotateCw className="h-5 w-5" />,
      defaultFlow: 360,
      description: '125mm dia, 12m hose reel',
      color: 'text-teal-600'
    },
    // Canopy options
    {
      type: 'extraction-point',
      name: 'Canopy 0.5x1m',
      icon: <Square className="h-5 w-5" />,
      defaultFlow: 500,
      description: '200mm dia, 0.5x1m canopy hood',
      color: 'text-orange-600'
    },
    {
      type: 'extraction-point',
      name: 'Canopy 1x1m',
      icon: <Square className="h-5 w-5" />,
      defaultFlow: 800,
      description: '250mm dia, 1x1m canopy hood',
      color: 'text-orange-600'
    },
    {
      type: 'extraction-point',
      name: 'Canopy 1x1.5m',
      icon: <Square className="h-5 w-5" />,
      defaultFlow: 1000,
      description: '300mm dia, 1x1.5m canopy hood',
      color: 'text-orange-600'
    },
    {
      type: 'extraction-point',
      name: 'Canopy 1x2m',
      icon: <Square className="h-5 w-5" />,
      defaultFlow: 1200,
      description: '315mm dia, 1x2m canopy hood',
      color: 'text-orange-600'
    },
    {
      type: 'extraction-point',
      name: 'Canopy 1.5x2m',
      icon: <Square className="h-5 w-5" />,
      defaultFlow: 1500,
      description: '355mm dia, 1.5x2m canopy hood',
      color: 'text-orange-600'
    },
    {
      type: 'extraction-point',
      name: 'Canopy 2x2m',
      icon: <Square className="h-5 w-5" />,
      defaultFlow: 1800,
      description: '400mm dia, 2x2m canopy hood',
      color: 'text-orange-600'
    },
    {
      type: 'extraction-point',
      name: 'Canopy 1x3m',
      icon: <Square className="h-5 w-5" />,
      defaultFlow: 1800,
      description: '400mm dia, 1x3m canopy hood',
      color: 'text-orange-600'
    },
    {
      type: 'extraction-point',
      name: 'Canopy 1.5x3m',
      icon: <Square className="h-5 w-5" />,
      defaultFlow: 2200,
      description: '450mm dia, 1.5x3m canopy hood',
      color: 'text-orange-600'
    }
  ];

  const systemComponents: ComponentType[] = [
    {
      type: 'dust-collector',
      name: 'Dust Collector',
      icon: <Filter className="h-5 w-5" />,
      defaultFlow: 0,
      description: 'Cyclone or bag dust collector',
      color: 'text-gray-800'
    },
    {
      type: 'fan',
      name: 'Centrifugal Fan',
      icon: <Fan className="h-5 w-5" />,
      defaultFlow: 0,
      description: 'System exhaust fan',
      color: 'text-blue-800'
    },
    {
      type: 'damper',
      name: 'Blast Gate',
      icon: <Square className="h-5 w-5" />,
      defaultFlow: 0,
      description: 'Flow control damper',
      color: 'text-red-800'
    }
  ];

  const handleAddComponent = (componentType: ComponentType) => {
    onAddComponent({
      type: componentType.type,
      name: componentType.name,
      flowRate: componentType.defaultFlow,
      diameter: componentType.type === 'extraction-point' ? 150 : 200,
      material: currentMaterial,
      angle: componentType.type === 'bend' ? 90 : undefined
    });
  };

  const loadPreset = (preset: any) => {
    // Add all components from preset
    preset.typical_components?.forEach((comp: any, index: number) => {
      setTimeout(() => {
        onAddComponent({
          type: 'extraction-point',
          name: comp.type?.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || `Component ${index + 1}`,
          flowRate: comp.flow || materials[currentMaterial]?.defaultFlow || 400,
          diameter: comp.diameter || 150,
          material: currentMaterial,
          x: 200 + (index * 100),
          y: 200 + (index * 80)
        });
      }, index * 100);
    });
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <Tabs defaultValue="sources" className="h-full">
        <TabsList className="grid w-full grid-cols-3 p-1 m-3 bg-gray-50">
          <TabsTrigger value="sources" className="text-xs">Sources</TabsTrigger>
          <TabsTrigger value="system" className="text-xs">System</TabsTrigger>
          <TabsTrigger value="presets" className="text-xs">Presets</TabsTrigger>
        </TabsList>

        <TabsContent value="sources" className="px-4 pb-4 space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Wind className="h-4 w-4" />
              Extraction Points
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {extractionPoints.map((component, index) => (
                <motion.button
                  key={component.name}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleAddComponent(component)}
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-left group"
                >
                  <div className={`${component.color} group-hover:scale-110 transition-transform`}>
                    {component.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm text-gray-800">{component.name}</div>
                    <div className="text-xs text-gray-500">{component.defaultFlow} m³/h</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-500" />
                </motion.button>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="system" className="px-4 pb-4 space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Package className="h-4 w-4" />
              System Components
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {systemComponents.map((component, index) => (
                <motion.button
                  key={component.name}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleAddComponent(component)}
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all duration-200 text-left group"
                >
                  <div className={`${component.color} group-hover:scale-110 transition-transform`}>
                    {component.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm text-gray-800">{component.name}</div>
                    <div className="text-xs text-gray-500">{component.description}</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-green-500" />
                </motion.button>
              ))}
            </div>
          </div>

          {/* Equipment Database */}
          {equipment.extraction.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Available Equipment</h4>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {equipment.extraction.slice(0, 5).map((item: any) => (
                  <div key={item.id} className="text-xs p-2 bg-gray-50 rounded border">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-gray-500">{item.airflow_m3_hr ? `${item.airflow_m3_hr} m³/h` : ''} {item.motor_power_kw ? `${item.motor_power_kw}kW` : ''}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="presets" className="px-4 pb-4 space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Industry Templates</h3>
            <div className="space-y-2">
              {presets.map((preset, index) => (
                <motion.button
                  key={preset.id}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => loadPreset(preset)}
                  className="w-full p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 transition-all duration-200 text-left"
                >
                  <div className="font-medium text-sm text-gray-800">{preset.name}</div>
                  <div className="text-xs text-gray-600 mt-1">{preset.description}</div>
                  <div className="text-xs text-blue-600 mt-1">
                    {preset.typical_components?.length || 0} components
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="text-sm font-semibold text-yellow-800 mb-1">Current Material</h4>
            <div className="text-xs text-yellow-700">
              {materials[currentMaterial]?.displayName || 'Unknown'}
              <br />
              Velocity: {materials[currentMaterial]?.minVelocity}-{materials[currentMaterial]?.maxVelocity} m/s
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
