
'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { LEVSystem, LEVComponent, MaterialProperties, CanvasState } from '@/lib/types';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  Grid3X3,
  Move,
  Link,
  RotateCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LEVCanvasProps {
  system: LEVSystem;
  selectedComponent: LEVComponent | null;
  onSelectComponent: (component: LEVComponent | null) => void;
  onUpdateComponent: (componentId: string, updates: Partial<LEVComponent>) => void;
  onDeleteComponent: (componentId: string) => void;
  onAddConnection: (from: string, to: string) => void;
  materials?: MaterialProperties;
  units: 'metric' | 'imperial';
}

export function LEVCanvas({
  system,
  selectedComponent,
  onSelectComponent,
  onUpdateComponent,
  onDeleteComponent,
  onAddConnection,
  materials,
  units
}: LEVCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [canvasState, setCanvasState] = useState<CanvasState>({
    zoom: 1.0,
    panX: 0,
    panY: 0,
    selectedTool: null,
    isDrawingConnection: false,
    connectionStart: null,
    gridSize: 20,
    snapToGrid: true
  });

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggedComponent, setDraggedComponent] = useState<string | null>(null);

  // Canvas setup and resize handling
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    
    if (!canvas || !container) return;

    const updateCanvasSize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      drawCanvas();
    };

    updateCanvasSize();

    const resizeObserver = new ResizeObserver(updateCanvasSize);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Redraw canvas when system or state changes
  useEffect(() => {
    drawCanvas();
  }, [system, canvasState, selectedComponent]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Save context for transformations
    ctx.save();

    // Apply zoom and pan
    ctx.translate(canvasState.panX, canvasState.panY);
    ctx.scale(canvasState.zoom, canvasState.zoom);

    // Draw grid
    if (canvasState.snapToGrid) {
      drawGrid(ctx, canvas.width, canvas.height);
    }

    // Draw connections first (behind components)
    system.connections.forEach(connection => {
      drawConnection(ctx, connection);
    });

    // Draw components
    system.components.forEach(component => {
      drawComponent(ctx, component);
    });

    // Draw connection preview if drawing
    if (canvasState.isDrawingConnection && canvasState.connectionStart) {
      drawConnectionPreview(ctx);
    }

    ctx.restore();
  }, [system, canvasState, selectedComponent]);

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const gridSize = canvasState.gridSize;
    
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 1 / canvasState.zoom;

    // Calculate visible grid bounds
    const startX = Math.floor(-canvasState.panX / canvasState.zoom / gridSize) * gridSize;
    const endX = startX + (width / canvasState.zoom) + gridSize;
    const startY = Math.floor(-canvasState.panY / canvasState.zoom / gridSize) * gridSize;
    const endY = startY + (height / canvasState.zoom) + gridSize;

    // Draw vertical lines
    for (let x = startX; x < endX; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }

    // Draw horizontal lines
    for (let y = startY; y < endY; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }

    ctx.restore();
  };

  const drawComponent = (ctx: CanvasRenderingContext2D, component: LEVComponent) => {
    const isSelected = selectedComponent?.id === component.id;
    const size = getComponentSize(component);
    
    ctx.save();

    // Component shadow
    if (!isSelected) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      ctx.shadowBlur = 4 / canvasState.zoom;
      ctx.shadowOffsetX = 2 / canvasState.zoom;
      ctx.shadowOffsetY = 2 / canvasState.zoom;
    }

    // Component background
    ctx.fillStyle = isSelected ? '#dbeafe' : getComponentColor(component);
    ctx.strokeStyle = isSelected ? '#3b82f6' : '#374151';
    ctx.lineWidth = isSelected ? 3 / canvasState.zoom : 1 / canvasState.zoom;

    // Draw component shape based on type
    switch (component.type) {
      case 'extraction-point':
        drawExtractionPoint(ctx, component, size, isSelected);
        break;
      case 'dust-collector':
        drawDustCollector(ctx, component, size, isSelected);
        break;
      case 'fan':
        drawFan(ctx, component, size, isSelected);
        break;
      case 'bend':
        drawBend(ctx, component, size, isSelected);
        break;
      case 'damper':
        drawDamper(ctx, component, size, isSelected);
        break;
      default:
        drawDefaultComponent(ctx, component, size, isSelected);
    }

    // Component label
    drawComponentLabel(ctx, component);

    ctx.restore();
  };

  const drawExtractionPoint = (
    ctx: CanvasRenderingContext2D, 
    component: LEVComponent, 
    size: number, 
    isSelected: boolean
  ) => {
    const radius = size / 2;
    
    ctx.beginPath();
    ctx.arc(component.x, component.y, radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    // Draw inlet representation
    ctx.save();
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 2 / canvasState.zoom;
    
    // Inlet lines
    const inletSize = radius * 0.6;
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const startX = component.x + Math.cos(angle) * inletSize * 0.3;
      const startY = component.y + Math.sin(angle) * inletSize * 0.3;
      const endX = component.x + Math.cos(angle) * inletSize;
      const endY = component.y + Math.sin(angle) * inletSize;
      
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }
    
    ctx.restore();
  };

  const drawDustCollector = (
    ctx: CanvasRenderingContext2D, 
    component: LEVComponent, 
    size: number, 
    isSelected: boolean
  ) => {
    const width = size * 1.2;
    const height = size * 1.8;
    const x = component.x - width / 2;
    const y = component.y - height / 2;

    // Main body
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.fill();
    ctx.stroke();

    // Filter section
    ctx.save();
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(x + width * 0.1, y + height * 0.1, width * 0.8, height * 0.3);
    
    // Filter lines
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 1 / canvasState.zoom;
    for (let i = 1; i < 4; i++) {
      const lineY = y + height * 0.1 + (height * 0.3 * i / 4);
      ctx.beginPath();
      ctx.moveTo(x + width * 0.1, lineY);
      ctx.lineTo(x + width * 0.9, lineY);
      ctx.stroke();
    }
    
    ctx.restore();

    // Dust bin
    ctx.save();
    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(x + width * 0.2, y + height * 0.7, width * 0.6, height * 0.25);
    ctx.strokeRect(x + width * 0.2, y + height * 0.7, width * 0.6, height * 0.25);
    ctx.restore();
  };

  const drawFan = (
    ctx: CanvasRenderingContext2D, 
    component: LEVComponent, 
    size: number, 
    isSelected: boolean
  ) => {
    const radius = size / 2;
    
    // Fan housing (circle)
    ctx.beginPath();
    ctx.arc(component.x, component.y, radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    // Fan blades
    ctx.save();
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2 / canvasState.zoom;
    
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const bladeRadius = radius * 0.7;
      
      ctx.beginPath();
      ctx.arc(
        component.x + Math.cos(angle) * bladeRadius * 0.3,
        component.y + Math.sin(angle) * bladeRadius * 0.3,
        bladeRadius * 0.2,
        angle - Math.PI / 6,
        angle + Math.PI / 6
      );
      ctx.stroke();
    }
    
    // Center hub
    ctx.beginPath();
    ctx.arc(component.x, component.y, radius * 0.2, 0, 2 * Math.PI);
    ctx.fillStyle = '#374151';
    ctx.fill();
    
    ctx.restore();
  };

  const drawBend = (
    ctx: CanvasRenderingContext2D, 
    component: LEVComponent, 
    size: number, 
    isSelected: boolean
  ) => {
    const angle = (component.angle || 90) * (Math.PI / 180);
    const lineWidth = Math.max(4, component.diameter / 20) / canvasState.zoom;
    
    ctx.save();
    ctx.strokeStyle = isSelected ? '#3b82f6' : '#6b7280';
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';

    // Draw bend arc
    const radius = size * 0.8;
    const startAngle = -Math.PI / 4;
    const endAngle = startAngle + angle;

    ctx.beginPath();
    ctx.arc(component.x, component.y, radius, startAngle, endAngle);
    ctx.stroke();

    // Draw connection points
    ctx.fillStyle = ctx.strokeStyle;
    const startX = component.x + Math.cos(startAngle) * radius;
    const startY = component.y + Math.sin(startAngle) * radius;
    const endX = component.x + Math.cos(endAngle) * radius;
    const endY = component.y + Math.sin(endAngle) * radius;

    ctx.beginPath();
    ctx.arc(startX, startY, lineWidth / 2, 0, 2 * Math.PI);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(endX, endY, lineWidth / 2, 0, 2 * Math.PI);
    ctx.fill();

    ctx.restore();
  };

  const drawDamper = (
    ctx: CanvasRenderingContext2D, 
    component: LEVComponent, 
    size: number, 
    isSelected: boolean
  ) => {
    const width = size;
    const height = size * 0.6;
    const x = component.x - width / 2;
    const y = component.y - height / 2;

    // Damper body
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.fill();
    ctx.stroke();

    // Damper blade
    ctx.save();
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 3 / canvasState.zoom;
    
    ctx.beginPath();
    ctx.moveTo(x + width * 0.2, component.y);
    ctx.lineTo(x + width * 0.8, component.y);
    ctx.stroke();

    // Blade handle
    ctx.beginPath();
    ctx.arc(x + width * 0.9, component.y, 3 / canvasState.zoom, 0, 2 * Math.PI);
    ctx.fillStyle = '#374151';
    ctx.fill();

    ctx.restore();
  };

  const drawDefaultComponent = (
    ctx: CanvasRenderingContext2D, 
    component: LEVComponent, 
    size: number, 
    isSelected: boolean
  ) => {
    const radius = size / 2;
    
    ctx.beginPath();
    ctx.arc(component.x, component.y, radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
  };

  const drawComponentLabel = (ctx: CanvasRenderingContext2D, component: LEVComponent) => {
    const fontSize = Math.max(10, 12 / canvasState.zoom);
    ctx.save();
    
    ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.fillStyle = '#374151';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const size = getComponentSize(component);
    const labelY = component.y + size / 2 + 8 / canvasState.zoom;

    // Component name
    ctx.fillText(component.name, component.x, labelY);

    // Flow rate for extraction points
    if (component.type === 'extraction-point' && component.flowRate > 0) {
      ctx.font = `${fontSize * 0.8}px -apple-system, BlinkMacSystemFont, sans-serif`;
      ctx.fillStyle = '#6b7280';
      ctx.fillText(`${component.flowRate} m³/h`, component.x, labelY + fontSize + 2);
    }

    // Diameter info
    if (component.diameter > 0) {
      ctx.fillText(`Ø${component.diameter}mm`, component.x, labelY + fontSize * 1.8 + 4);
    }

    ctx.restore();
  };

  const drawConnection = (ctx: CanvasRenderingContext2D, connection: any) => {
    const fromComponent = system.components.find(c => c.id === connection.from);
    const toComponent = system.components.find(c => c.id === connection.to);
    
    if (!fromComponent || !toComponent) return;

    ctx.save();

    // Line thickness based on diameter
    const lineWidth = Math.max(2, connection.diameter / 50) / canvasState.zoom;
    ctx.lineWidth = lineWidth;
    
    // Color based on velocity
    const velocity = connection.velocity || 0;
    let color = '#6b7280'; // Default gray
    
    if (materials) {
      if (velocity < materials.minVelocity) {
        color = '#ef4444'; // Red for low velocity
      } else if (velocity > materials.maxVelocity) {
        color = '#f59e0b'; // Orange for high velocity
      } else {
        color = '#10b981'; // Green for optimal velocity
      }
    }
    
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';

    // Draw connection line
    ctx.beginPath();
    ctx.moveTo(fromComponent.x, fromComponent.y);
    ctx.lineTo(toComponent.x, toComponent.y);
    ctx.stroke();

    // Draw flow direction arrow
    const midX = (fromComponent.x + toComponent.x) / 2;
    const midY = (fromComponent.y + toComponent.y) / 2;
    const angle = Math.atan2(toComponent.y - fromComponent.y, toComponent.x - fromComponent.x);
    
    drawArrow(ctx, midX, midY, angle, 8 / canvasState.zoom);

    ctx.restore();
  };

  const drawConnectionPreview = (ctx: CanvasRenderingContext2D) => {
    // Implementation for connection preview while drawing
    // This would show a dashed line from the start component to the mouse cursor
  };

  const drawArrow = (ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, size: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-size, -size / 2);
    ctx.lineTo(-size, size / 2);
    ctx.closePath();
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
    
    ctx.restore();
  };

  const getComponentSize = (component: LEVComponent): number => {
    const baseSize = 40;
    switch (component.type) {
      case 'dust-collector': return baseSize * 1.5;
      case 'fan': return baseSize * 1.2;
      case 'bend': return baseSize * 0.8;
      case 'damper': return baseSize;
      default: return baseSize;
    }
  };

  const getComponentColor = (component: LEVComponent): string => {
    switch (component.type) {
      case 'extraction-point': return '#dbeafe';
      case 'dust-collector': return '#f3f4f6';
      case 'fan': return '#ddd6fe';
      case 'bend': return '#d1fae5';
      case 'damper': return '#fed7d7';
      default: return '#f9fafb';
    }
  };

  // Mouse event handlers
  const getMousePosition = (event: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left - canvasState.panX) / canvasState.zoom;
    const y = (event.clientY - rect.top - canvasState.panY) / canvasState.zoom;
    
    return { x, y };
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    const mousePos = getMousePosition(event);
    
    // Check if clicking on a component
    const clickedComponent = system.components.find(component => {
      const size = getComponentSize(component);
      const distance = Math.sqrt(
        Math.pow(mousePos.x - component.x, 2) + Math.pow(mousePos.y - component.y, 2)
      );
      return distance <= size / 2;
    });

    if (clickedComponent) {
      onSelectComponent(clickedComponent);
      
      if (canvasState.isDrawingConnection) {
        if (canvasState.connectionStart && canvasState.connectionStart !== clickedComponent.id) {
          onAddConnection(canvasState.connectionStart, clickedComponent.id);
          setCanvasState(prev => ({ ...prev, isDrawingConnection: false, connectionStart: null }));
        } else {
          setCanvasState(prev => ({ ...prev, connectionStart: clickedComponent.id }));
        }
      } else {
        setDraggedComponent(clickedComponent.id);
        setIsDragging(true);
        setDragStart({ x: mousePos.x - clickedComponent.x, y: mousePos.y - clickedComponent.y });
      }
    } else {
      onSelectComponent(null);
      if (!canvasState.isDrawingConnection) {
        setIsDragging(true);
        setDragStart({ x: mousePos.x, y: mousePos.y });
      }
    }
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!isDragging) return;

    const mousePos = getMousePosition(event);

    if (draggedComponent) {
      // Drag component
      const newX = mousePos.x - dragStart.x;
      const newY = mousePos.y - dragStart.y;
      
      // Snap to grid if enabled
      const finalX = canvasState.snapToGrid 
        ? Math.round(newX / canvasState.gridSize) * canvasState.gridSize
        : newX;
      const finalY = canvasState.snapToGrid
        ? Math.round(newY / canvasState.gridSize) * canvasState.gridSize  
        : newY;

      onUpdateComponent(draggedComponent, { x: finalX, y: finalY });
    } else {
      // Pan canvas
      const deltaX = (mousePos.x - dragStart.x) * canvasState.zoom;
      const deltaY = (mousePos.y - dragStart.y) * canvasState.zoom;
      
      setCanvasState(prev => ({
        ...prev,
        panX: prev.panX + deltaX,
        panY: prev.panY + deltaY
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedComponent(null);
  };

  const handleWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    
    const mousePos = getMousePosition(event);
    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(3, canvasState.zoom * zoomFactor));
    
    // Zoom towards mouse position
    const newPanX = canvasState.panX - (mousePos.x * (newZoom - canvasState.zoom));
    const newPanY = canvasState.panY - (mousePos.y * (newZoom - canvasState.zoom));

    setCanvasState(prev => ({
      ...prev,
      zoom: newZoom,
      panX: newPanX,
      panY: newPanY
    }));
  };

  // Canvas controls
  const zoomIn = () => {
    setCanvasState(prev => ({ ...prev, zoom: Math.min(3, prev.zoom * 1.2) }));
  };

  const zoomOut = () => {
    setCanvasState(prev => ({ ...prev, zoom: Math.max(0.1, prev.zoom / 1.2) }));
  };

  const fitToView = () => {
    if (system.components.length === 0) return;

    const padding = 50;
    const minX = Math.min(...system.components.map(c => c.x)) - padding;
    const maxX = Math.max(...system.components.map(c => c.x)) + padding;
    const minY = Math.min(...system.components.map(c => c.y)) - padding;
    const maxY = Math.max(...system.components.map(c => c.y)) + padding;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    const zoomX = canvas.width / contentWidth;
    const zoomY = canvas.height / contentHeight;
    const zoom = Math.min(zoomX, zoomY, 2);

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const panX = canvas.width / 2 - centerX * zoom;
    const panY = canvas.height / 2 - centerY * zoom;

    setCanvasState(prev => ({ ...prev, zoom, panX, panY }));
  };

  const toggleConnectionMode = () => {
    setCanvasState(prev => ({
      ...prev,
      isDrawingConnection: !prev.isDrawingConnection,
      connectionStart: null
    }));
  };

  const toggleGrid = () => {
    setCanvasState(prev => ({ ...prev, snapToGrid: !prev.snapToGrid }));
  };

  return (
    <div ref={containerRef} className="flex-1 relative bg-gray-50">
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        className="w-full h-full cursor-crosshair"
        style={{ 
          cursor: canvasState.isDrawingConnection ? 'crosshair' : 
                  draggedComponent ? 'grabbing' : 
                  'grab' 
        }}
      />

      {/* Canvas Controls */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute top-4 right-4 flex flex-col gap-2"
      >
        <Button onClick={zoomIn} size="sm" variant="outline" className="h-10 w-10 p-0">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button onClick={zoomOut} size="sm" variant="outline" className="h-10 w-10 p-0">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button onClick={fitToView} size="sm" variant="outline" className="h-10 w-10 p-0">
          <Maximize className="h-4 w-4" />
        </Button>
        <Button 
          onClick={toggleGrid} 
          size="sm" 
          variant={canvasState.snapToGrid ? "default" : "outline"} 
          className="h-10 w-10 p-0"
        >
          <Grid3X3 className="h-4 w-4" />
        </Button>
        <Button 
          onClick={toggleConnectionMode} 
          size="sm" 
          variant={canvasState.isDrawingConnection ? "default" : "outline"} 
          className="h-10 w-10 p-0"
        >
          <Link className="h-4 w-4" />
        </Button>
      </motion.div>

      {/* Status Bar */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
        <div className="bg-white bg-opacity-90 backdrop-blur-sm px-3 py-1 rounded-lg shadow-md text-sm text-gray-600">
          Zoom: {(canvasState.zoom * 100).toFixed(0)}% | 
          Components: {system.components.length} | 
          Connections: {system.connections.length}
        </div>
        
        {canvasState.isDrawingConnection && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg"
          >
            <span className="text-sm font-medium">Connection Mode Active</span>
            <span className="text-xs block">Click components to connect them</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
