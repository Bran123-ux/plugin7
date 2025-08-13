
import { LEVComponent, LEVConnection, PressureLoss, MaterialProperties } from './types';

// LEV Calculation Engine
export class LEVCalculations {
  private static readonly AIR_DENSITY = 1.2; // kg/m³
  private static readonly FRICTION_FACTOR = 0.02;
  private static readonly ROUGHNESS = 0.15; // mm for galvanized steel

  /**
   * Calculate duct diameter for given flow rate and velocity
   */
  static calculateDuctDiameter(flowRate: number, velocity: number): number {
    // Q = A × V, where A = π × (D/2)²
    // D = √(4Q/(π × V))
    const flowRateMs = flowRate / 3600; // Convert m³/h to m³/s
    const diameter = Math.sqrt((4 * flowRateMs) / (Math.PI * velocity));
    return this.roundToStandardSize(diameter * 1000); // Convert to mm
  }

  /**
   * Round diameter to nearest standard duct size
   */
  static roundToStandardSize(diameter: number): number {
    const standardSizes = [80, 100, 125, 150, 160, 180, 200, 224, 250, 300, 315, 355, 400, 450, 500, 560, 600, 630, 710, 800];
    return standardSizes.reduce((prev, curr) => 
      Math.abs(curr - diameter) < Math.abs(prev - diameter) ? curr : prev
    );
  }

  /**
   * Calculate velocity for given flow rate and diameter
   */
  static calculateVelocity(flowRate: number, diameter: number): number {
    const area = Math.PI * Math.pow(diameter / 2000, 2); // Convert mm to m and calculate area
    const flowRateMs = flowRate / 3600; // Convert m³/h to m³/s
    return flowRateMs / area;
  }

  /**
   * Calculate friction pressure loss in straight duct
   */
  static calculateFrictionLoss(
    flowRate: number, 
    diameter: number, 
    length: number, 
    roughness: number = this.ROUGHNESS
  ): number {
    const velocity = this.calculateVelocity(flowRate, diameter);
    const diameterM = diameter / 1000; // Convert to meters
    const reynoldsNumber = (velocity * diameterM * this.AIR_DENSITY) / (1.8e-5); // Air viscosity
    
    // Colebrook-White equation approximation
    const frictionFactor = 0.25 / Math.pow(
      Math.log10((roughness / 1000) / (3.7 * diameterM) + 5.74 / Math.pow(reynoldsNumber, 0.9)), 2
    );
    
    // Darcy-Weisbach equation
    const pressureLoss = frictionFactor * (length / diameterM) * 
      (this.AIR_DENSITY * Math.pow(velocity, 2)) / 2;
    
    return Math.round(pressureLoss);
  }

  /**
   * Calculate fitting pressure loss
   */
  static calculateFittingLoss(
    flowRate: number, 
    diameter: number, 
    fittingType: 'bend' | 'tee' | 'reducer' | 'expansion',
    angle?: number
  ): number {
    const velocity = this.calculateVelocity(flowRate, diameter);
    const dynamicPressure = (this.AIR_DENSITY * Math.pow(velocity, 2)) / 2;
    
    let lossCoefficient = 0;
    
    switch (fittingType) {
      case 'bend':
        // Loss coefficient based on angle
        const bendAngle = angle || 90;
        lossCoefficient = 0.2 + (bendAngle / 90) * 0.3;
        break;
      case 'tee':
        lossCoefficient = 0.4; // Through flow
        break;
      case 'reducer':
        lossCoefficient = 0.15;
        break;
      case 'expansion':
        lossCoefficient = 0.6;
        break;
    }
    
    return Math.round(dynamicPressure * lossCoefficient);
  }

  /**
   * Calculate total system pressure loss
   */
  static calculateSystemPressure(
    components: LEVComponent[], 
    connections: LEVConnection[]
  ): { totalPressure: number; pressureLosses: PressureLoss[] } {
    const pressureLosses: PressureLoss[] = [];
    let totalPressure = 0;

    // Calculate friction losses for all connections
    connections.forEach(connection => {
      const frictionLoss = this.calculateFrictionLoss(
        connection.velocity * (Math.PI * Math.pow(connection.diameter / 2000, 2)) * 3600,
        connection.diameter,
        connection.length
      );
      
      pressureLosses.push({
        component: connection.id,
        type: 'friction',
        loss: frictionLoss,
        velocity: connection.velocity,
        diameter: connection.diameter
      });
      
      totalPressure += frictionLoss;
    });

    // Calculate fitting losses for components
    components.forEach(component => {
      let fittingLoss = 0;
      
      switch (component.type) {
        case 'bend':
          fittingLoss = this.calculateFittingLoss(
            component.flowRate, 
            component.diameter, 
            'bend',
            component.angle
          );
          break;
        case 'tee':
          fittingLoss = this.calculateFittingLoss(
            component.flowRate, 
            component.diameter, 
            'tee'
          );
          break;
        case 'reducer':
          fittingLoss = this.calculateFittingLoss(
            component.flowRate, 
            component.diameter, 
            'reducer'
          );
          break;
      }
      
      if (fittingLoss > 0) {
        pressureLosses.push({
          component: component.id,
          type: 'fitting',
          loss: fittingLoss,
          velocity: this.calculateVelocity(component.flowRate, component.diameter),
          diameter: component.diameter
        });
        
        totalPressure += fittingLoss;
      }
    });

    return { totalPressure: Math.round(totalPressure), pressureLosses };
  }

  /**
   * Size main duct based on total flow and material properties
   */
  static sizeMainDuct(totalFlow: number, material: MaterialProperties): number {
    const optimalVelocity = (material.minVelocity + material.maxVelocity) / 2;
    return this.calculateDuctDiameter(totalFlow, optimalVelocity);
  }

  /**
   * Validate system design and generate warnings
   */
  static validateSystem(
    components: LEVComponent[], 
    connections: LEVConnection[], 
    materials: { [key: string]: MaterialProperties }
  ): string[] {
    const warnings: string[] = [];

    // Check velocities
    connections.forEach(connection => {
      if (connection.velocity < 10) {
        warnings.push(`Low velocity (${connection.velocity.toFixed(1)} m/s) in duct ${connection.id} - risk of settling`);
      }
      if (connection.velocity > 30) {
        warnings.push(`High velocity (${connection.velocity.toFixed(1)} m/s) in duct ${connection.id} - excessive pressure loss`);
      }
    });

    // Check component flow rates
    components.forEach(component => {
      if (component.type === 'extraction-point' && component.flowRate < 100) {
        warnings.push(`Low flow rate (${component.flowRate} m³/h) at ${component.name} - may be insufficient`);
      }
    });

    // Check for unconnected components
    const connectedIds = new Set();
    connections.forEach(conn => {
      connectedIds.add(conn.from);
      connectedIds.add(conn.to);
    });
    
    components.forEach(component => {
      if (!connectedIds.has(component.id) && component.type !== 'dust-collector' && component.type !== 'fan') {
        warnings.push(`Component ${component.name} is not connected to the system`);
      }
    });

    return warnings;
  }

  /**
   * Auto-size all ducts in the system
   */
  static autoSizeSystem(
    components: LEVComponent[], 
    connections: LEVConnection[],
    material: MaterialProperties
  ): { components: LEVComponent[]; connections: LEVConnection[] } {
    const updatedComponents = [...components];
    const updatedConnections = [...connections];

    // Size ducts based on flow and material properties
    updatedConnections.forEach(connection => {
      const optimalVelocity = (material.minVelocity + material.maxVelocity) / 2;
      const totalFlow = this.calculateConnectionFlow(connection.id, updatedComponents, updatedConnections);
      connection.diameter = this.calculateDuctDiameter(totalFlow, optimalVelocity);
      connection.velocity = this.calculateVelocity(totalFlow, connection.diameter);
    });

    // Update component diameters
    updatedComponents.forEach(component => {
      if (component.type !== 'extraction-point') {
        const optimalVelocity = (material.minVelocity + material.maxVelocity) / 2;
        component.diameter = this.calculateDuctDiameter(component.flowRate, optimalVelocity);
      }
    });

    return { components: updatedComponents, connections: updatedConnections };
  }

  /**
   * Calculate total flow through a connection
   */
  private static calculateConnectionFlow(
    connectionId: string, 
    components: LEVComponent[], 
    connections: LEVConnection[]
  ): number {
    // Simple implementation - in a real system, this would trace the network
    // For now, assume each connection carries the flow of connected extraction points
    const connection = connections.find(c => c.id === connectionId);
    if (!connection) return 0;

    const downstreamComponents = this.getDownstreamComponents(connection.to, components, connections);
    return downstreamComponents
      .filter(c => c.type === 'extraction-point')
      .reduce((total, c) => total + c.flowRate, 0);
  }

  /**
   * Get all components downstream from a given component
   */
  private static getDownstreamComponents(
    componentId: string, 
    components: LEVComponent[], 
    connections: LEVConnection[]
  ): LEVComponent[] {
    // Simple implementation - traverse the network
    const visited = new Set<string>();
    const downstream: LEVComponent[] = [];
    
    const traverse = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);
      
      const component = components.find(c => c.id === id);
      if (component) {
        downstream.push(component);
      }
      
      // Find connections from this component
      const outgoingConnections = connections.filter(c => c.from === id);
      outgoingConnections.forEach(conn => traverse(conn.to));
    };
    
    traverse(componentId);
    return downstream;
  }
}

// Export calculation utilities
export const calculateDuctDiameter = LEVCalculations.calculateDuctDiameter;
export const calculateVelocity = LEVCalculations.calculateVelocity;
export const calculateFrictionLoss = LEVCalculations.calculateFrictionLoss;
export const calculateSystemPressure = LEVCalculations.calculateSystemPressure;
export const validateSystem = LEVCalculations.validateSystem;
export const autoSizeSystem = LEVCalculations.autoSizeSystem;
