
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LEVComponent, MaterialProperties } from '@/lib/types';
import { 
  Settings, 
  Trash2, 
  MousePointer, 
  Info, 
  Zap,
  Gauge,
  Ruler,
  Wind
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PropertiesPanelProps {
  selectedComponent: LEVComponent | null;
  onUpdateComponent: (componentId: string, updates: Partial<LEVComponent>) => void;
  onDeleteComponent: (componentId: string) => void;
  materials: { [key: string]: MaterialProperties };
  currentMaterial: string;
}

const STANDARD_DIAMETERS = [80, 100, 125, 150, 160, 180, 200, 224, 250, 300, 315, 355, 400, 450, 500, 560, 630, 710, 800];

export function PropertiesPanel({ 
  selectedComponent, 
  onUpdateComponent, 
  onDeleteComponent,
  materials,
  currentMaterial 
}: PropertiesPanelProps) {
  const [localComponent, setLocalComponent] = useState<LEVComponent | null>(null);

  useEffect(() => {
    setLocalComponent(selectedComponent);
  }, [selectedComponent]);

  const handleUpdate = (field: keyof LEVComponent, value: any) => {
    if (!localComponent) return;

    const updates = { [field]: value };
    setLocalComponent(prev => prev ? { ...prev, [field]: value } : null);
    onUpdateComponent(localComponent.id, updates);
  };

  const handleDelete = () => {
    if (localComponent) {
      onDeleteComponent(localComponent.id);
    }
  };

  const getComponentIcon = (type: LEVComponent['type']) => {
    switch (type) {
      case 'extraction-point': return <Wind className="h-4 w-4 text-blue-600" />;
      case 'dust-collector': return <div className="h-4 w-4 bg-gray-600 rounded" />;
      case 'fan': return <div className="h-4 w-4 bg-blue-600 rounded-full" />;
      case 'bend': return <div className="h-4 w-4 bg-green-600 rounded border-2 border-green-800" />;
      case 'damper': return <div className="h-4 w-4 bg-red-600 rounded" />;
      default: return <div className="h-4 w-4 bg-gray-400 rounded" />;
    }
  };

  if (!localComponent) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <MousePointer className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-500 mb-2">No Selection</h3>
          <p className="text-sm text-gray-400">
            Select a component on the canvas to edit its properties
          </p>
        </motion.div>
      </div>
    );
  }

  const currentMaterialProps = materials[localComponent.material] || materials[currentMaterial];

  return (
    <motion.div
      key={localComponent.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 overflow-y-auto p-4 space-y-6"
    >
      {/* Component Header */}
      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        {getComponentIcon(localComponent.type)}
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800">{localComponent.name}</h3>
          <p className="text-sm text-gray-600 capitalize">
            {localComponent.type.replace('-', ' ')}
          </p>
        </div>
        <Button
          onClick={handleDelete}
          size="sm"
          variant="destructive"
          className="h-8 w-8 p-0"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Basic Properties */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-3">
          <Settings className="h-4 w-4 text-gray-600" />
          <h4 className="font-semibold text-gray-800">Basic Properties</h4>
        </div>

        <div className="space-y-3">
          <div>
            <Label htmlFor="name" className="text-sm font-medium">Component Name</Label>
            <Input
              id="name"
              value={localComponent.name}
              onChange={(e) => handleUpdate('name', e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="material" className="text-sm font-medium">Material Type</Label>
            <Select value={localComponent.material} onValueChange={(value) => handleUpdate('material', value)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(materials).map(([key, material]) => (
                  <SelectItem key={key} value={key}>
                    {material.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Flow Properties */}
      {(localComponent.type === 'extraction-point' || localComponent.type === 'fan' || localComponent.type === 'dust-collector') && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <Wind className="h-4 w-4 text-blue-600" />
            <h4 className="font-semibold text-gray-800">Flow Properties</h4>
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="flowRate" className="text-sm font-medium">
                Flow Rate (m³/h)
              </Label>
              <Input
                id="flowRate"
                type="number"
                value={localComponent.flowRate}
                onChange={(e) => handleUpdate('flowRate', parseInt(e.target.value) || 0)}
                className="mt-1"
                min="0"
                step="50"
              />
              {currentMaterialProps && (
                <p className="text-xs text-gray-500 mt-1">
                  Recommended: {currentMaterialProps.defaultFlow} m³/h
                </p>
              )}
            </div>

            {localComponent.staticPressure !== undefined && (
              <div>
                <Label htmlFor="staticPressure" className="text-sm font-medium">
                  Static Pressure (Pa)
                </Label>
                <Input
                  id="staticPressure"
                  type="number"
                  value={localComponent.staticPressure}
                  onChange={(e) => handleUpdate('staticPressure', parseInt(e.target.value) || 0)}
                  className="mt-1"
                  min="0"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dimensional Properties */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-3">
          <Ruler className="h-4 w-4 text-green-600" />
          <h4 className="font-semibold text-gray-800">Dimensions</h4>
        </div>

        <div className="space-y-3">
          <div>
            <Label htmlFor="diameter" className="text-sm font-medium">
              {localComponent.type === 'extraction-point' ? 'Inlet' : 'Duct'} Diameter (mm)
            </Label>
            <Select 
              value={localComponent.diameter?.toString() || "150"} 
              onValueChange={(value) => handleUpdate('diameter', parseInt(value))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STANDARD_DIAMETERS.map(diameter => (
                  <SelectItem key={diameter} value={diameter.toString()}>
                    Ø{diameter}mm
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {localComponent.type === 'bend' && (
            <div>
              <Label htmlFor="angle" className="text-sm font-medium">
                Bend Angle (degrees)
              </Label>
              <Select 
                value={localComponent.angle?.toString() || "90"} 
                onValueChange={(value) => handleUpdate('angle', parseInt(value))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15°</SelectItem>
                  <SelectItem value="30">30°</SelectItem>
                  <SelectItem value="45">45°</SelectItem>
                  <SelectItem value="60">60°</SelectItem>
                  <SelectItem value="90">90°</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center justify-between">
            <Label htmlFor="blastGate" className="text-sm font-medium">
              Include Blast Gate
            </Label>
            <Switch
              id="blastGate"
              checked={localComponent.hasBlastGate || false}
              onCheckedChange={(checked) => handleUpdate('hasBlastGate', checked)}
            />
          </div>
        </div>
      </div>

      {/* Performance Indicators */}
      {currentMaterialProps && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <Gauge className="h-4 w-4 text-orange-600" />
            <h4 className="font-semibold text-gray-800">Performance & Face Velocity</h4>
          </div>

          {/* Face Velocity Calculations */}
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="text-sm font-medium text-yellow-800 mb-2">Face Velocity Analysis</div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span>Current Face Velocity:</span>
                <span className="font-medium">
                  {((localComponent.flowRate / 3600) / (Math.PI * Math.pow((localComponent.diameter || 150) / 2000, 2))).toFixed(1)} m/s
                </span>
              </div>
              <div className="flex justify-between">
                <span>Recommended Range:</span>
                <span>{currentMaterialProps.minVelocity}-{currentMaterialProps.maxVelocity} m/s</span>
              </div>
              
              {/* Auto-suggestions */}
              <div className="mt-2 pt-2 border-t border-yellow-200">
                <div className="text-sm font-medium text-yellow-800 mb-1">Suggestions:</div>
                <div className="space-y-1">
                  {(() => {
                    const currentVelocity = (localComponent.flowRate / 3600) / (Math.PI * Math.pow((localComponent.diameter || 150) / 2000, 2));
                    const targetVelocity = (currentMaterialProps.minVelocity + currentMaterialProps.maxVelocity) / 2;
                    const suggestedFlow = Math.round(targetVelocity * Math.PI * Math.pow((localComponent.diameter || 150) / 2000, 2) * 3600);
                    const suggestedDiameter = Math.round(2000 * Math.sqrt((localComponent.flowRate / 3600) / (targetVelocity * Math.PI)));

                    return (
                      <>
                        <button
                          onClick={() => handleUpdate('flowRate', suggestedFlow)}
                          className="block w-full text-left p-1 bg-white rounded border hover:bg-yellow-100 text-xs"
                        >
                          Optimal Flow: {suggestedFlow} m³/h
                        </button>
                        <button
                          onClick={() => handleUpdate('diameter', suggestedDiameter)}
                          className="block w-full text-left p-1 bg-white rounded border hover:bg-yellow-100 text-xs"
                        >
                          Optimal Diameter: Ø{suggestedDiameter}mm
                        </button>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">Duct Velocity</div>
              <div className="font-medium">
                {((localComponent.flowRate / 3600) / (Math.PI * Math.pow((localComponent.diameter || 150) / 2000, 2))).toFixed(1)} m/s
              </div>
              <div className="text-xs text-gray-500">
                Target: {currentMaterialProps.minVelocity}-{currentMaterialProps.maxVelocity} m/s
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">Flow Rate</div>
              <div className="font-medium">{localComponent.flowRate} m³/h</div>
              <div className="text-xs text-gray-500">
                {localComponent.flowRate >= currentMaterialProps.defaultFlow ? 'Adequate' : 'Low'}
              </div>
            </div>
          </div>

          {/* Pressure Drop Estimation */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm font-medium text-blue-800 mb-2">Estimated Pressure Drop</div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">Component Loss:</span>
              <Input
                type="number"
                value={localComponent.staticPressure || 50}
                onChange={(e) => handleUpdate('staticPressure', parseInt(e.target.value) || 50)}
                className="w-20 h-6 text-xs"
                min="0"
                step="10"
              />
              <span className="text-xs text-blue-600">Pa</span>
            </div>
            <div className="text-xs text-blue-600 mt-1">
              Editable - adjust based on hood design and equipment
            </div>
          </div>
        </div>
      )}

      {/* Component-Specific Settings */}
      <AnimatePresence>
        {localComponent.equipment && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <Info className="h-4 w-4 text-blue-600" />
              <h4 className="font-semibold text-gray-800">Equipment Details</h4>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="font-medium text-blue-800">{localComponent.equipment.model}</div>
              <div className="text-sm text-blue-600 mt-1">
                £{localComponent.equipment.price?.toLocaleString() || 'Quote Required'}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Position Coordinates */}
      <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-500">
        <div>Position: ({Math.round(localComponent.x)}, {Math.round(localComponent.y)})</div>
        <div>ID: {localComponent.id}</div>
      </div>
    </motion.div>
  );
}
