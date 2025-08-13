
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean existing data
  console.log('🧹 Cleaning existing data...');
  await prisma.bOMItem.deleteMany();
  await prisma.lEVProject.deleteMany();
  await prisma.calculationTemplate.deleteMany();
  await prisma.industryPreset.deleteMany();
  await prisma.materialProperty.deleteMany();
  await prisma.extractionEquipment.deleteMany();
  await prisma.ductingProduct.deleteMany();

  // Seed Material Properties
  console.log('📊 Seeding material properties...');
  const materials = [
    {
      material_type: 'wood-chips',
      display_name: 'Wood Chips/Dust',
      min_velocity_ms: 20.0,
      max_velocity_ms: 28.0,
      default_flow_m3h: 500,
      density_kg_m3: 0.65,
      description: 'Fine wood particles, shavings, and sawdust'
    },
    {
      material_type: 'metal-dust',
      display_name: 'Metal Dust',
      min_velocity_ms: 18.0,
      max_velocity_ms: 25.0,
      default_flow_m3h: 400,
      density_kg_m3: 2.8,
      description: 'Metal grinding and machining particles'
    },
    {
      material_type: 'welding-fumes',
      display_name: 'Welding Fumes',
      min_velocity_ms: 10.0,
      max_velocity_ms: 15.0,
      default_flow_m3h: 200,
      density_kg_m3: 1.5,
      description: 'Welding and cutting fumes'
    },
    {
      material_type: 'flour-sugar',
      display_name: 'Flour/Sugar',
      min_velocity_ms: 23.0,
      max_velocity_ms: 30.0,
      default_flow_m3h: 600,
      density_kg_m3: 0.8,
      description: 'Fine food processing powders'
    },
    {
      material_type: 'plastic-pellets',
      display_name: 'Plastic Pellets',
      min_velocity_ms: 15.0,
      max_velocity_ms: 23.0,
      default_flow_m3h: 350,
      density_kg_m3: 1.2,
      description: 'Plastic manufacturing particles'
    },
    {
      material_type: 'general-dust',
      display_name: 'General Dust',
      min_velocity_ms: 18.0,
      max_velocity_ms: 25.0,
      default_flow_m3h: 400,
      density_kg_m3: 1.0,
      description: 'General industrial dust and particles'
    }
  ];

  for (const material of materials) {
    await prisma.materialProperty.create({
      data: material
    });
  }

  // Seed Ducting Products
  console.log('🔧 Seeding ducting products...');
  
  // Spiral Ducting - Standard sizes
  const standardSizes = [80, 100, 125, 150, 160, 180, 200, 224, 250, 300, 315, 355, 400, 450, 500, 560, 600, 630, 710, 800];
  
  for (const size of standardSizes) {
    await prisma.ductingProduct.create({
      data: {
        name: `Spiral Duct Ø${size}mm`,
        category: 'spiral-duct',
        diameter_mm: size,
        length_mm: 3000, // Standard 3m lengths
        material: 'galvanized_steel',
        standard: 'DW144',
        unit_price_gbp: size <= 200 ? 25.50 : size <= 400 ? 45.75 : 68.90,
        weight_kg: (size / 100) * 2.8,
        description: `High-quality galvanized steel spiral ducting, ${size}mm diameter, 3m length`
      }
    });
  }

  // Fabricated Reducers
  const reducerConfigs = [
    { large: 250, small: 200 }, { large: 315, small: 250 }, { large: 400, small: 315 },
    { large: 500, small: 400 }, { large: 630, small: 500 }, { large: 800, small: 630 }
  ];
  
  for (const config of reducerConfigs) {
    await prisma.ductingProduct.create({
      data: {
        name: `Fabricated Reducer ${config.large}mm-${config.small}mm`,
        category: 'reducer',
        subcategory: 'fabricated',
        large_diameter_mm: config.large,
        small_diameter_mm: config.small,
        unit_price_gbp: 85.50 + (config.large * 0.15),
        weight_kg: ((config.large + config.small) / 200) * 2.2,
        description: `Fabricated reducer from ${config.large}mm to ${config.small}mm`
      }
    });
  }

  // Bends - 90 degree standard
  for (const size of standardSizes) {
    await prisma.ductingProduct.create({
      data: {
        name: `90° Bend Ø${size}mm`,
        category: 'bend',
        diameter_mm: size,
        angle_degrees: 90,
        unit_price_gbp: size <= 200 ? 35.25 : size <= 400 ? 52.75 : 78.50,
        weight_kg: (size / 100) * 1.8,
        description: `90-degree bend fitting for ${size}mm ducting`
      }
    });
  }

  // Blast Gate Dampers
  const damperSizes = [80, 100, 125, 150, 160, 180, 200, 225, 250, 300, 315, 355];
  for (const size of damperSizes) {
    await prisma.ductingProduct.create({
      data: {
        name: `Blast Gate Damper Ø${size}mm`,
        category: 'damper',
        subcategory: 'blast-gate',
        diameter_mm: size,
        unit_price_gbp: 75.00 + (size * 0.25),
        weight_kg: (size / 100) * 2.5,
        description: `Blast gate damper for flow control, ${size}mm diameter`
      }
    });
  }

  // Seed Extraction Equipment
  console.log('💨 Seeding extraction equipment...');

  // Wood Dust Collectors (WDC-S Series)
  const woodCollectors = [
    {
      name: 'Wood Dust Collector WDC-S-1',
      model: 'WDC-S-1',
      category: 'dust_collector',
      series: 'WDC-S',
      motor_power_kw: 2.2,
      airflow_m3_hr: 2592,
      filtration_area_m2: 6.63,
      inlet_diameter_mm: 180,
      dimensions_l_mm: 1330,
      dimensions_w_mm: 670,
      dimensions_h_mm: 2925,
      waste_capacity_l: 175,
      filter_type: 'polyester_350gsm',
      unit_price_gbp: 3250.00,
      description: 'Compact wood dust collector suitable for small workshops'
    },
    {
      name: 'Wood Dust Collector WDC-S-2',
      model: 'WDC-S-2',
      category: 'dust_collector',
      series: 'WDC-S',
      motor_power_kw: 4.0,
      airflow_m3_hr: 4600,
      filtration_area_m2: 12.26,
      inlet_diameter_mm: 250,
      dimensions_l_mm: 1930,
      dimensions_w_mm: 670,
      dimensions_h_mm: 2925,
      waste_capacity_l: 350,
      filter_type: 'polyester_350gsm',
      unit_price_gbp: 4850.00,
      description: 'Medium capacity wood dust collector for multiple machines'
    },
    {
      name: 'Wood Dust Collector WDC-S-4',
      model: 'WDC-S-4',
      category: 'dust_collector',
      series: 'WDC-S',
      motor_power_kw: 7.5,
      airflow_m3_hr: 5940,
      filtration_area_m2: 26.52,
      inlet_diameter_mm: 300,
      dimensions_l_mm: 3170,
      dimensions_w_mm: 770,
      dimensions_h_mm: 2925,
      waste_capacity_l: 700,
      filter_type: 'polyester_350gsm',
      unit_price_gbp: 7250.00,
      description: 'High capacity wood dust collector for industrial applications'
    }
  ];

  for (const collector of woodCollectors) {
    await prisma.extractionEquipment.create({
      data: collector
    });
  }

  // Centrifugal Fans (F-Series)
  const centrifugalFans = [
    {
      name: 'Centrifugal Fan 0.37kW',
      model: 'FAN-0.37',
      category: 'fan',
      series: 'F-Series',
      motor_power_kw: 0.37,
      airflow_m3_hr: 1519,
      static_pressure_pa: 653,
      rpm: 2800,
      weight_kg: 18,
      dimensions_l_mm: 545,
      dimensions_w_mm: 443,
      dimensions_h_mm: 545,
      unit_price_gbp: 485.00
    },
    {
      name: 'Centrifugal Fan 3.0kW',
      model: 'FAN-3.0',
      category: 'fan',
      series: 'F-Series',
      motor_power_kw: 3.0,
      airflow_m3_hr: 4633,
      static_pressure_pa: 1886,
      rpm: 2880,
      weight_kg: 62,
      dimensions_l_mm: 860,
      dimensions_w_mm: 597,
      dimensions_h_mm: 860,
      unit_price_gbp: 1250.00
    },
    {
      name: 'Centrifugal Fan 7.5kW',
      model: 'FAN-7.5',
      category: 'fan',
      series: 'F-Series',
      motor_power_kw: 7.5,
      airflow_m3_hr: 8845,
      static_pressure_pa: 2950,
      rpm: 2915,
      weight_kg: 130,
      dimensions_l_mm: 1054,
      dimensions_w_mm: 785,
      dimensions_h_mm: 973,
      unit_price_gbp: 2850.00
    },
    {
      name: 'Centrifugal Fan 18.5kW',
      model: 'FAN-18.5',
      category: 'fan',
      series: 'F-Series',
      motor_power_kw: 18.5,
      airflow_m3_hr: 12547,
      static_pressure_pa: 3600,
      rpm: 2940,
      weight_kg: 232,
      dimensions_l_mm: 1192,
      dimensions_w_mm: 970,
      dimensions_h_mm: 1099,
      unit_price_gbp: 4750.00
    }
  ];

  for (const fan of centrifugalFans) {
    await prisma.extractionEquipment.create({
      data: fan
    });
  }

  // Industry Presets
  console.log('🏭 Seeding industry presets...');
  const presets = [
    {
      name: 'Small Woodworking Shop',
      industry_type: 'woodshop',
      description: 'Typical small woodworking shop with table saw, router, and sanders',
      default_materials: ['wood-chips'],
      typical_components: [
        { type: 'table-saw', flow: 500, diameter: 150 },
        { type: 'router', flow: 300, diameter: 100 },
        { type: 'sander', flow: 400, diameter: 125 }
      ],
      design_guidelines: {
        main_velocity: 22,
        branch_velocity: 20,
        collector_oversizing: 1.2
      }
    },
    {
      name: 'Welding/Grinding Bay',
      industry_type: 'weldshop',
      description: 'Welding and grinding operations with fume extraction',
      default_materials: ['welding-fumes', 'metal-dust'],
      typical_components: [
        { type: 'welding-booth', flow: 200, diameter: 125 },
        { type: 'grinder', flow: 350, diameter: 125 },
        { type: 'cutting-table', flow: 400, diameter: 150 }
      ],
      design_guidelines: {
        main_velocity: 12,
        branch_velocity: 10,
        collector_oversizing: 1.3
      }
    }
  ];

  for (const preset of presets) {
    await prisma.industryPreset.create({
      data: preset
    });
  }

  // Calculation Templates
  console.log('🧮 Seeding calculation templates...');
  const calculations = [
    {
      name: 'Duct Pressure Loss',
      formula_type: 'pressure_loss',
      parameters: {
        friction_factor: 0.02,
        air_density: 1.2,
        roughness: 0.15
      },
      formula: 'ΔP = f * (L/D) * (ρ * V²/2)',
      units: {
        pressure: 'Pa',
        velocity: 'm/s',
        length: 'm',
        diameter: 'm'
      },
      description: 'Standard duct friction loss calculation'
    },
    {
      name: 'Fan Power Calculation',
      formula_type: 'fan_selection',
      parameters: {
        fan_efficiency: 0.75,
        motor_efficiency: 0.9
      },
      formula: 'P = (Q * ΔP) / (3600 * η_fan * η_motor)',
      units: {
        power: 'kW',
        flow: 'm³/h',
        pressure: 'Pa'
      },
      description: 'Required fan power calculation'
    }
  ];

  for (const calc of calculations) {
    await prisma.calculationTemplate.create({
      data: calc
    });
  }

  console.log('✅ Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
