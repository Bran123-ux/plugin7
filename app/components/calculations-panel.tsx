
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { LEVSystem, MaterialProperties } from '@/lib/types';
import { 
  Calculator, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Wind, 
  Gauge,
  Zap,
  Info,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CalculationsPanelProps {
  system: LEVSystem;
  materials?: MaterialProperties;
  units: 'metric' | 'imperial';
}

export function CalculationsPanel({ system, materials, units }: CalculationsPanelProps) {
  const [showDetails, setShowDetails] = useState(true);

  const formatValue = (value: number, unit: string) => {
    return `${value.toLocaleString()} ${unit}`;
  };

  const getVelocityStatus = (velocity: number) => {
    if (!materials) return 'unknown';
    
    if (velocity < materials.minVelocity) return 'low';
    if (velocity > materials.maxVelocity) return 'high';
    return 'optimal';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'low': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'optimal': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'low': return <AlertTriangle className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'optimal': return <CheckCircle className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      {/* System Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-800">System Analysis</h3>
          </div>
          <Button
            onClick={() => setShowDetails(!showDetails)}
            size="sm"
            variant="outline"
            className="h-8 px-2"
          >
            {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Wind className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Total Flow</span>
            </div>
            <div className="text-2xl font-bold text-blue-900">{system.totalFlow}</div>
            <div className="text-sm text-blue-700">m³/h</div>
          </div>

          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <Gauge className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">System SP</span>
            </div>
            <div className="text-2xl font-bold text-green-900">{system.totalPressure}</div>
            <div className="text-sm text-green-700">Pa</div>
          </div>

          <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-4 w-4 bg-purple-600 rounded-full" />
              <span className="text-sm font-medium text-purple-800">Main Duct</span>
            </div>
            <div className="text-2xl font-bold text-purple-900">Ø{system.mainDuctSize}</div>
            <div className="text-sm text-purple-700">mm</div>
          </div>

          <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">Efficiency</span>
            </div>
            <div className="text-2xl font-bold text-orange-900">{system.calculations.fanSelection.efficiency}</div>
            <div className="text-sm text-orange-700">%</div>
          </div>
        </div>
      </motion.div>

      {/* Pressure Losses */}
      {showDetails && system.calculations.pressureLosses.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-red-600" />
            <h4 className="font-semibold text-gray-800">Pressure Losses</h4>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {system.calculations.pressureLosses.map((loss, index) => {
              const velocityStatus = getVelocityStatus(loss.velocity);
              
              return (
                <motion.div
                  key={index}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-sm text-gray-800 truncate">
                      {loss.component}
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(velocityStatus)}`}>
                      {getStatusIcon(velocityStatus)}
                      <span className="ml-1">{velocityStatus}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500">Loss:</span>
                      <div className="font-medium">{loss.loss} Pa</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Velocity:</span>
                      <div className="font-medium">{loss.velocity.toFixed(1)} m/s</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Ø:</span>
                      <div className="font-medium">{loss.diameter}mm</div>
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded capitalize">
                      {loss.type.replace('_', ' ')}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Fan Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 bg-blue-600 rounded-full" />
          <h4 className="font-semibold text-gray-800">Fan Selection</h4>
        </div>

        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-xs text-gray-600 mb-1">Required Flow</div>
              <div className="font-bold text-lg">{formatValue(system.calculations.fanSelection.requiredFlow, 'm³/h')}</div>
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-1">Required Pressure</div>
              <div className="font-bold text-lg">{formatValue(system.calculations.fanSelection.requiredPressure, 'Pa')}</div>
            </div>
          </div>

          {system.calculations.fanSelection.recommendedFan ? (
            <div className="p-3 bg-white rounded-lg border">
              <div className="font-medium text-blue-800 mb-1">
                {system.calculations.fanSelection.recommendedFan.name}
              </div>
              <div className="text-sm text-gray-600">
                {system.calculations.fanSelection.recommendedFan.power}kW • 
                {system.calculations.fanSelection.recommendedFan.efficiency}% efficiency
              </div>
            </div>
          ) : (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800">
                <Info className="h-4 w-4" />
                <span className="text-sm font-medium">Fan Selection Required</span>
              </div>
              <div className="text-sm text-yellow-700 mt-1">
                Based on system requirements: {system.calculations.fanSelection.requiredFlow} m³/h at {system.calculations.fanSelection.requiredPressure} Pa
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* System Warnings */}
      {system.warnings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <h4 className="font-semibold text-gray-800">System Warnings</h4>
          </div>

          <div className="space-y-2">
            {system.warnings.map((warning, index) => (
              <motion.div
                key={index}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-yellow-800">{warning}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Design Guidelines */}
      {materials && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-green-600" />
            <h4 className="font-semibold text-gray-800">Design Guidelines</h4>
          </div>

          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-sm font-medium text-green-800 mb-2">
              {materials.displayName} System
            </div>
            
            <div className="space-y-2 text-sm text-green-700">
              <div className="flex justify-between">
                <span>Recommended Velocity:</span>
                <span>{materials.minVelocity} - {materials.maxVelocity} m/s</span>
              </div>
              <div className="flex justify-between">
                <span>Material Density:</span>
                <span>{materials.density} kg/m³</span>
              </div>
              <div className="flex justify-between">
                <span>Default Flow Rate:</span>
                <span>{materials.defaultFlow} m³/h per point</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Calculation Summary */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-600">
        <div className="font-medium mb-2">Calculation Notes</div>
        <ul className="space-y-1">
          <li>• Pressure losses calculated using Darcy-Weisbach equation</li>
          <li>• Velocities based on material properties and industry standards</li>
          <li>• Fan selection includes 10% safety margin</li>
          <li>• Air density: 1.2 kg/m³ at 20°C</li>
        </ul>
      </div>
    </div>
  );
}
