
'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LEVCanvas } from './lev-canvas';
import { ComponentPanel } from './component-panel';
import { PropertiesPanel } from './properties-panel';
import { CalculationsPanel } from './calculations-panel';
import { BOMPanel } from './bom-panel';
import { LEVComponent, LEVConnection, LEVSystem, MaterialProperties, BOMItem } from '@/lib/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { LEVCalculations } from '@/lib/calculations';
import { 
  Save, 
  FolderOpen, 
  Plus, 
  Settings, 
  Calculator, 
  FileText, 
  Download,
  Upload,
  Zap,
  RotateCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';

export function LEVDesigner() {
  // Core state
  const [currentSystem, setCurrentSystem] = useState<LEVSystem>({
    id: 'new-system',
    name: 'Untitled Project',
    components: [],
    connections: [],
    totalFlow: 0,
    totalPressure: 0,
    mainDuctSize: 0,
    warnings: [],
    calculations: {
      pressureLosses: [],
      fanSelection: { requiredFlow: 0, requiredPressure: 0, recommendedFan: null, operatingPoint: { flow: 0, pressure: 0 }, efficiency: 0 },
      ductSizing: { mainDuct: 0, branches: {}, velocities: {} }
    }
  });

  const [selectedComponent, setSelectedComponent] = useState<LEVComponent | null>(null);

  // Auto-switch to properties tab when selecting component
  const handleSelectComponent = (component: LEVComponent | null) => {
    setSelectedComponent(component);
    if (component && activeTab !== 'properties') {
      setActiveTab('properties');
    }
  };
  const [materials, setMaterials] = useState<{ [key: string]: MaterialProperties }>({});
  const [currentMaterial, setCurrentMaterial] = useState<string>('wood-chips');
  const [units, setUnits] = useState<'metric' | 'imperial'>('metric');
  const [activeTab, setActiveTab] = useState<string>('properties');
  const [bomItems, setBomItems] = useState<BOMItem[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);

  // Modal states
  const [showRerouteModal, setShowRerouteModal] = useState(false);
  const [showSystemModal, setShowSystemModal] = useState(false);
  const [routingOrder, setRoutingOrder] = useState<string[]>([]);
  const [selectedForRoute, setSelectedForRoute] = useState<string[]>([]);

  // Load materials and equipment on mount
  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      const response = await fetch('/api/materials');
      if (response.ok) {
        const materialData = await response.json();
        const materialsMap: { [key: string]: MaterialProperties } = {};
        
        materialData.forEach((material: any) => {
          materialsMap[material.material_type] = {
            type: material.material_type,
            displayName: material.display_name,
            minVelocity: parseFloat(material.min_velocity_ms?.toString() || '18'),
            maxVelocity: parseFloat(material.max_velocity_ms?.toString() || '25'),
            defaultFlow: material.default_flow_m3h || 400,
            density: parseFloat(material.density_kg_m3?.toString() || '1.0')
          };
        });
        
        setMaterials(materialsMap);
      }
    } catch (error) {
      console.error('Failed to load materials:', error);
      toast({
        title: "Error",
        description: "Failed to load material properties",
        variant: "destructive"
      });
    }
  };

  // Component management
  const addComponent = useCallback((componentData: Partial<LEVComponent>) => {
    const newComponent: LEVComponent = {
      id: `component-${Date.now()}`,
      type: 'extraction-point',
      name: 'New Component',
      x: 400,
      y: 300,
      flowRate: materials[currentMaterial]?.defaultFlow || 400,
      diameter: 150,
      material: currentMaterial,
      ...componentData
    };

    setCurrentSystem(prev => ({
      ...prev,
      components: [...prev.components, newComponent]
    }));

    setSelectedComponent(newComponent);
    recalculateSystem();
  }, [currentMaterial, materials]);

  const updateComponent = useCallback((componentId: string, updates: Partial<LEVComponent>) => {
    setCurrentSystem(prev => ({
      ...prev,
      components: prev.components.map(comp => 
        comp.id === componentId ? { ...comp, ...updates } : comp
      )
    }));

    if (selectedComponent?.id === componentId) {
      setSelectedComponent(prev => prev ? { ...prev, ...updates } : null);
    }

    recalculateSystem();
  }, [selectedComponent]);

  const deleteComponent = useCallback((componentId: string) => {
    setCurrentSystem(prev => ({
      ...prev,
      components: prev.components.filter(comp => comp.id !== componentId),
      connections: prev.connections.filter(conn => 
        conn.from !== componentId && conn.to !== componentId
      )
    }));

    if (selectedComponent?.id === componentId) {
      setSelectedComponent(null);
    }

    recalculateSystem();
  }, [selectedComponent]);

  // Connection management
  const addConnection = useCallback((from: string, to: string) => {
    const newConnection: LEVConnection = {
      id: `connection-${Date.now()}`,
      from,
      to,
      diameter: 150,
      length: 5, // Default 5m length
      pressureLoss: 0,
      velocity: 0,
      points: []
    };

    setCurrentSystem(prev => ({
      ...prev,
      connections: [...prev.connections, newConnection]
    }));

    recalculateSystem();
  }, []);

  // System calculations
  const recalculateSystem = useCallback(async () => {
    if (isCalculating) return;
    
    setIsCalculating(true);
    
    try {
      // Calculate total flow
      const totalFlow = currentSystem.components
        .filter(comp => comp.type === 'extraction-point')
        .reduce((sum, comp) => sum + comp.flowRate, 0);

      // Calculate system pressure
      const { totalPressure, pressureLosses } = LEVCalculations.calculateSystemPressure(
        currentSystem.components,
        currentSystem.connections
      );

      // Size main duct
      const currentMaterialProps = materials[currentMaterial];
      const mainDuctSize = currentMaterialProps ? 
        LEVCalculations.sizeMainDuct(totalFlow, currentMaterialProps) : 200;

      // Validate system
      const warnings = LEVCalculations.validateSystem(
        currentSystem.components,
        currentSystem.connections,
        materials
      );

      // Update system
      setCurrentSystem(prev => ({
        ...prev,
        totalFlow,
        totalPressure,
        mainDuctSize,
        warnings,
        calculations: {
          pressureLosses,
          fanSelection: {
            requiredFlow: totalFlow,
            requiredPressure: totalPressure,
            recommendedFan: null,
            operatingPoint: { flow: totalFlow, pressure: totalPressure },
            efficiency: 75
          },
          ductSizing: {
            mainDuct: mainDuctSize,
            branches: {},
            velocities: {}
          }
        }
      }));

      // Generate BOM
      await generateBOM();

    } catch (error) {
      console.error('Calculation error:', error);
      toast({
        title: "Calculation Error",
        description: "Failed to recalculate system parameters",
        variant: "destructive"
      });
    } finally {
      setIsCalculating(false);
    }
  }, [currentSystem.components, currentSystem.connections, materials, currentMaterial, isCalculating]);

  // Auto-size system
  const autoSizeSystem = useCallback(() => {
    const currentMaterialProps = materials[currentMaterial];
    if (!currentMaterialProps) return;

    const { components, connections } = LEVCalculations.autoSizeSystem(
      currentSystem.components,
      currentSystem.connections,
      currentMaterialProps
    );

    setCurrentSystem(prev => ({
      ...prev,
      components,
      connections
    }));

    toast({
      title: "System Auto-Sized",
      description: "All ducts have been automatically sized based on industry standards",
    });

    recalculateSystem();
  }, [currentSystem, materials, currentMaterial, recalculateSystem]);

  // BOM generation
  const generateBOM = useCallback(async () => {
    const bomItems: BOMItem[] = [];

    // Add ducting from connections
    currentSystem.connections.forEach(connection => {
      bomItems.push({
        id: `bom-${connection.id}`,
        name: `Spiral Duct Ø${connection.diameter}mm`,
        category: 'ducting',
        quantity: connection.length,
        unit: 'm',
        unitPrice: connection.diameter <= 200 ? 25.50 : connection.diameter <= 400 ? 45.75 : 68.90,
        totalPrice: (connection.diameter <= 200 ? 25.50 : connection.diameter <= 400 ? 45.75 : 68.90) * connection.length
      });
    });

    // Add components
    currentSystem.components.forEach(component => {
      let price = 0;
      let unit = 'ea';
      
      switch (component.type) {
        case 'dust-collector':
          price = 4500;
          break;
        case 'fan':
          price = 2250;
          break;
        case 'bend':
          price = component.diameter <= 200 ? 35.25 : component.diameter <= 400 ? 52.75 : 78.50;
          break;
        case 'damper':
          price = 75 + (component.diameter * 0.25);
          break;
        default:
          price = 150;
      }

      bomItems.push({
        id: `bom-${component.id}`,
        name: component.name,
        category: component.type,
        quantity: 1,
        unit,
        unitPrice: price,
        totalPrice: price
      });
    });

    setBomItems(bomItems);
  }, [currentSystem]);

  // Project management
  const saveProject = useCallback(async () => {
    try {
      const projectData = {
        name: currentSystem.name,
        client_name: 'Client Name',
        units,
        project_data: {
          system: currentSystem,
          materials: currentMaterial,
          bom: bomItems
        }
      };

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
      });

      if (response.ok) {
        const savedProject = await response.json();
        setCurrentSystem(prev => ({ ...prev, id: savedProject.id }));
        
        toast({
          title: "Project Saved",
          description: "Your LEV system design has been saved successfully",
        });
      }
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Save Error",
        description: "Failed to save the project",
        variant: "destructive"
      });
    }
  }, [currentSystem, units, currentMaterial, bomItems]);

  const exportProject = useCallback(() => {
    const exportData = {
      system: currentSystem,
      materials: currentMaterial,
      bom: bomItems,
      exportedAt: new Date().toISOString()
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `${currentSystem.name.replace(/\s+/g, '_')}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    toast({
      title: "Project Exported",
      description: "LEV system design exported as JSON file",
    });
  }, [currentSystem, currentMaterial, bomItems]);

  // Reroute ducting function
  const handleReroute = useCallback(() => {
    if (routingOrder.length < 2) {
      toast({
        title: "Invalid Route",
        description: "Please select at least 2 components to create a route",
        variant: "destructive"
      });
      return;
    }

    // Create new connections based on routing order
    const newConnections: LEVConnection[] = [];
    
    for (let i = 0; i < routingOrder.length - 1; i++) {
      const fromId = routingOrder[i];
      const toId = routingOrder[i + 1];
      
      newConnections.push({
        id: `connection-${Date.now()}-${i}`,
        from: fromId,
        to: toId,
        diameter: 150, // Will be auto-sized
        length: 5, // Default length
        pressureLoss: 0,
        velocity: 0,
        points: []
      });
    }

    // Remove existing connections between these components
    const filteredConnections = currentSystem.connections.filter(conn => 
      !routingOrder.includes(conn.from) || !routingOrder.includes(conn.to)
    );

    setCurrentSystem(prev => ({
      ...prev,
      connections: [...filteredConnections, ...newConnections]
    }));

    setShowRerouteModal(false);
    setRoutingOrder([]);
    recalculateSystem();

    toast({
      title: "Ducting Rerouted",
      description: `Created new routing through ${routingOrder.length} components`,
    });
  }, [routingOrder, currentSystem, recalculateSystem]);

  // Add preset system function
  const addPresetSystem = useCallback((systemType: string) => {
    const systemConfig = {
      'wood-dust': {
        components: [
          { type: 'extraction-point', name: 'Table Saw', flowRate: 500, x: 200, y: 200 },
          { type: 'extraction-point', name: 'Belt Sander', flowRate: 400, x: 400, y: 200 },
          { type: 'dust-collector', name: 'Cyclone Collector', flowRate: 0, x: 600, y: 100 },
          { type: 'fan', name: 'Centrifugal Fan', flowRate: 0, x: 800, y: 100 }
        ]
      },
      'welding': {
        components: [
          { type: 'extraction-point', name: 'Welding Station 1', flowRate: 200, x: 200, y: 200 },
          { type: 'extraction-point', name: 'Grinding Station', flowRate: 350, x: 400, y: 200 },
          { type: 'dust-collector', name: 'Filter Unit', flowRate: 0, x: 600, y: 100 },
          { type: 'fan', name: 'Extraction Fan', flowRate: 0, x: 800, y: 100 }
        ]
      },
      'spray-booth': {
        components: [
          { type: 'extraction-point', name: 'Spray Booth', flowRate: 2000, x: 300, y: 200 },
          { type: 'extraction-point', name: 'Prep Station', flowRate: 800, x: 500, y: 200 },
          { type: 'fan', name: 'Exhaust Fan', flowRate: 0, x: 700, y: 100 }
        ]
      }
    };

    const config = systemConfig[systemType as keyof typeof systemConfig];
    if (!config) return;

    // Add components
    config.components.forEach((compData, index) => {
      setTimeout(() => {
        addComponent({
          ...compData,
          type: compData.type as LEVComponent['type'],
          material: currentMaterial,
          diameter: 150
        });
      }, index * 200);
    });

    setShowSystemModal(false);
    toast({
      title: "System Added",
      description: `Added ${systemType.replace('-', ' ')} preset system`,
    });
  }, [currentMaterial, addComponent]);

  // Generate complete system with ducting
  const generateCompleteSystem = useCallback(() => {
    const extractionPoints = currentSystem.components.filter(comp => comp.type === 'extraction-point');
    const collectors = currentSystem.components.filter(comp => comp.type === 'dust-collector');
    const fans = currentSystem.components.filter(comp => comp.type === 'fan');

    if (extractionPoints.length === 0) {
      toast({
        title: "No Extraction Points",
        description: "Add extraction points before generating system",
        variant: "destructive"
      });
      return;
    }

    // Add collector and fan if missing
    if (collectors.length === 0) {
      addComponent({
        type: 'dust-collector',
        name: 'System Collector',
        x: 600,
        y: 200,
        flowRate: 0,
        diameter: 200,
        material: currentMaterial
      });
    }

    if (fans.length === 0) {
      addComponent({
        type: 'fan',
        name: 'System Fan',
        x: 800,
        y: 200,
        flowRate: 0,
        diameter: 250,
        material: currentMaterial
      });
    }

    // Auto-connect components
    setTimeout(() => {
      const allComponents = [
        ...extractionPoints,
        ...collectors.length > 0 ? collectors : [currentSystem.components.find(c => c.type === 'dust-collector')],
        ...fans.length > 0 ? fans : [currentSystem.components.find(c => c.type === 'fan')]
      ].filter(Boolean);

      for (let i = 0; i < allComponents.length - 1; i++) {
        const from = allComponents[i];
        const to = allComponents[i + 1];
        
        if (from && to) {
          addConnection(from.id, to.id);
        }
      }
    }, 500);

    toast({
      title: "System Generated",
      description: "Added complete system with ducting connections",
    });
  }, [currentSystem, addComponent, addConnection, currentMaterial]);

  // Trigger initial calculation when materials load
  useEffect(() => {
    if (Object.keys(materials).length > 0) {
      recalculateSystem();
    }
  }, [materials]);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left Panel - Components */}
      <motion.div 
        initial={{ x: -300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-80 bg-white shadow-lg flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-800">LEV Designer Pro</h1>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={() => setCurrentSystem({
              id: 'new-system',
              name: 'Untitled Project',
              components: [],
              connections: [],
              totalFlow: 0,
              totalPressure: 0,
              mainDuctSize: 0,
              warnings: [],
              calculations: {
                pressureLosses: [],
                fanSelection: { requiredFlow: 0, requiredPressure: 0, recommendedFan: null, operatingPoint: { flow: 0, pressure: 0 }, efficiency: 0 },
                ductSizing: { mainDuct: 0, branches: {}, velocities: {} }
              }
            })} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
            <Button onClick={saveProject} size="sm" variant="outline">
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
            <Button onClick={exportProject} size="sm" variant="outline">
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>

        {/* System Controls */}
        <div className="p-4 border-b border-gray-200 space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Material Type
            </label>
            <select 
              value={currentMaterial} 
              onChange={(e) => {
                setCurrentMaterial(e.target.value);
                // Auto-recalculate system when material changes
                setTimeout(() => recalculateSystem(), 100);
              }}
              className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Object.entries(materials).map(([key, material]) => (
                <option key={key} value={key}>
                  {material.displayName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Units</span>
            <button
              onClick={() => setUnits(units === 'metric' ? 'imperial' : 'metric')}
              className="px-3 py-1 bg-gray-100 rounded-md text-sm hover:bg-gray-200 transition-colors"
            >
              {units === 'metric' ? 'Metric' : 'Imperial'}
            </button>
          </div>

          <div className="space-y-2">
            <Button onClick={autoSizeSystem} className="w-full" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Auto-Size System
            </Button>
            
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => setShowRerouteModal(true)} size="sm" variant="outline">
                <RotateCw className="h-4 w-4 mr-1" />
                Reroute
              </Button>
              <Button onClick={() => setShowSystemModal(true)} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Add System
              </Button>
            </div>
            
            <Button onClick={generateCompleteSystem} className="w-full" size="sm" variant="secondary">
              <Zap className="h-4 w-4 mr-2" />
              Generate Complete System
            </Button>
          </div>
        </div>

        {/* Component Library */}
        <ComponentPanel 
          onAddComponent={addComponent}
          currentMaterial={currentMaterial}
          materials={materials}
        />
      </motion.div>

      {/* Center Panel - Canvas */}
      <div className="flex-1 flex flex-col">
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white border-b border-gray-200 p-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <input
                type="text"
                value={currentSystem.name}
                onChange={(e) => setCurrentSystem(prev => ({ ...prev, name: e.target.value }))}
                className="text-lg font-semibold bg-transparent border-none focus:outline-none focus:bg-gray-50 px-2 py-1 rounded"
              />
              {isCalculating && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  Calculating...
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-sm">
              <div className="px-3 py-1 bg-blue-50 rounded-lg border border-blue-200">
                <span className="font-medium text-blue-800">Flow: {currentSystem.totalFlow.toLocaleString()} m³/h</span>
              </div>
              <div className="px-3 py-1 bg-green-50 rounded-lg border border-green-200">
                <span className="font-medium text-green-800">Pressure: {currentSystem.totalPressure} Pa</span>
              </div>
              <div className="px-3 py-1 bg-purple-50 rounded-lg border border-purple-200">
                <span className="font-medium text-purple-800">Main Duct: Ø{currentSystem.mainDuctSize}mm</span>
              </div>
            </div>
          </div>
        </motion.div>

        <LEVCanvas
          system={currentSystem}
          selectedComponent={selectedComponent}
          onSelectComponent={handleSelectComponent}
          onUpdateComponent={updateComponent}
          onDeleteComponent={deleteComponent}
          onAddConnection={addConnection}
          materials={materials[currentMaterial]}
          units={units}
        />
      </div>

      {/* Right Panel - Properties & Analysis */}
      <motion.div 
        initial={{ x: 300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-96 bg-white shadow-lg flex flex-col"
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3 p-1 bg-gray-50">
            <TabsTrigger value="properties" className="flex items-center gap-1">
              <Settings className="h-4 w-4" />
              Properties
            </TabsTrigger>
            <TabsTrigger value="calculations" className="flex items-center gap-1">
              <Calculator className="h-4 w-4" />
              Analysis
            </TabsTrigger>
            <TabsTrigger value="bom" className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              BOM
            </TabsTrigger>
          </TabsList>

          <TabsContent value="properties" className="flex-1 overflow-hidden">
            <PropertiesPanel
              selectedComponent={selectedComponent}
              onUpdateComponent={updateComponent}
              onDeleteComponent={deleteComponent}
              materials={materials}
              currentMaterial={currentMaterial}
            />
          </TabsContent>

          <TabsContent value="calculations" className="flex-1 overflow-hidden">
            <CalculationsPanel
              system={currentSystem}
              materials={materials[currentMaterial]}
              units={units}
            />
          </TabsContent>

          <TabsContent value="bom" className="flex-1 overflow-hidden">
            <BOMPanel
              bomItems={bomItems}
              system={currentSystem}
              onUpdateBOM={setBomItems}
            />
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Reroute Modal */}
      <Dialog open={showRerouteModal} onOpenChange={setShowRerouteModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reroute Ducting</DialogTitle>
            <DialogDescription>
              Select components in routing order (from fan to extraction points)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="max-h-60 overflow-y-auto space-y-2">
              {currentSystem.components.map(component => (
                <div key={component.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={component.id}
                    checked={selectedForRoute.includes(component.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedForRoute(prev => [...prev, component.id]);
                      } else {
                        setSelectedForRoute(prev => prev.filter(id => id !== component.id));
                      }
                    }}
                  />
                  <label htmlFor={component.id} className="text-sm cursor-pointer">
                    {component.name} ({component.type.replace('-', ' ')})
                  </label>
                </div>
              ))}
            </div>
            
            {selectedForRoute.length > 0 && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-sm font-medium mb-2">Selected Route Order:</div>
                <div className="space-y-1">
                  {selectedForRoute.map((id, index) => {
                    const component = currentSystem.components.find(c => c.id === id);
                    return (
                      <div key={id} className="text-xs flex items-center gap-2">
                        <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium">
                          {index + 1}
                        </span>
                        {component?.name}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button 
                onClick={() => setRoutingOrder(selectedForRoute)} 
                className="flex-1"
                disabled={selectedForRoute.length < 2}
              >
                Set Route Order
              </Button>
              <Button 
                onClick={() => {
                  setSelectedForRoute([]);
                  setRoutingOrder([]);
                }} 
                variant="outline"
              >
                Clear
              </Button>
            </div>
            
            <Button 
              onClick={handleReroute} 
              className="w-full"
              disabled={routingOrder.length < 2}
            >
              Apply Rerouting
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* System Generation Modal */}
      <Dialog open={showSystemModal} onOpenChange={setShowSystemModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Preset System</DialogTitle>
            <DialogDescription>
              Select a complete system configuration to add to your design
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3">
            <Button 
              onClick={() => addPresetSystem('wood-dust')} 
              className="w-full justify-start h-auto p-4" 
              variant="outline"
            >
              <div className="text-left">
                <div className="font-medium">Wood Dust Workshop</div>
                <div className="text-sm text-gray-500">Table saw, sander, collector & fan</div>
              </div>
            </Button>
            
            <Button 
              onClick={() => addPresetSystem('welding')} 
              className="w-full justify-start h-auto p-4" 
              variant="outline"
            >
              <div className="text-left">
                <div className="font-medium">Welding & Grinding</div>
                <div className="text-sm text-gray-500">Welding station, grinder, filter & fan</div>
              </div>
            </Button>
            
            <Button 
              onClick={() => addPresetSystem('spray-booth')} 
              className="w-full justify-start h-auto p-4" 
              variant="outline"
            >
              <div className="text-left">
                <div className="font-medium">Spray Painting Booth</div>
                <div className="text-sm text-gray-500">Spray booth, prep station & exhaust fan</div>
              </div>
            </Button>
            
            <div className="pt-3 border-t">
              <Button 
                onClick={generateCompleteSystem} 
                className="w-full" 
                variant="default"
              >
                <Zap className="h-4 w-4 mr-2" />
                Auto-Generate from Existing Components
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
