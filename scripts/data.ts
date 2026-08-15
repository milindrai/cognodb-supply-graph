/**
 * Realistic (but synthetic) seed data for a multi-industry supply chain.
 *
 * The graph models how finished PRODUCTS are built from COMPONENTS, which are
 * themselves built from sub-components (DEPENDS_ON), each sourced from one or
 * more SUPPLIERS located in geographic REGIONS, and assembled at FACILITIES.
 */

export interface RegionSeed {
  id: string;
  name: string;
  riskNote: string;
}
export interface SupplierSeed {
  id: string;
  name: string;
  country: string;
  regionId: string;
  tier: number;
  riskScore: number; // 0-100, higher = riskier
}
export interface ComponentSeed {
  id: string;
  name: string;
  category: string;
}
export interface ProductSeed {
  id: string;
  name: string;
  category: string;
}
export interface FacilitySeed {
  id: string;
  name: string;
  country: string;
  regionId: string;
}

export const regions: RegionSeed[] = [
  { id: "reg-ea", name: "East Asia", riskNote: "High concentration of semiconductor & battery supply" },
  { id: "reg-sea", name: "Southeast Asia", riskNote: "Assembly & packaging hub" },
  { id: "reg-sa", name: "South Asia", riskNote: "Emerging electronics manufacturing" },
  { id: "reg-eu", name: "Europe", riskNote: "Precision components & chemicals" },
  { id: "reg-na", name: "North America", riskNote: "Design, chips & specialty materials" },
];

export const suppliers: SupplierSeed[] = [
  // East Asia
  { id: "sup-tsc", name: "TaiSilicon Foundry", country: "Taiwan", regionId: "reg-ea", tier: 2, riskScore: 78 },
  { id: "sup-hyn", name: "Hynex Memory", country: "South Korea", regionId: "reg-ea", tier: 2, riskScore: 55 },
  { id: "sup-cav", name: "CATL-Volt Cells", country: "China", regionId: "reg-ea", tier: 2, riskScore: 72 },
  { id: "sup-nid", name: "Nidon Precision Motors", country: "Japan", regionId: "reg-ea", tier: 2, riskScore: 40 },
  { id: "sup-skg", name: "SK Glass & Display", country: "South Korea", regionId: "reg-ea", tier: 1, riskScore: 48 },
  // Southeast Asia
  { id: "sup-asg", name: "AsiaSemi Assembly", country: "Malaysia", regionId: "reg-sea", tier: 1, riskScore: 44 },
  { id: "sup-vnw", name: "VinWire Harness", country: "Vietnam", regionId: "reg-sea", tier: 1, riskScore: 33 },
  { id: "sup-thp", name: "ThaiPoly Plastics", country: "Thailand", regionId: "reg-sea", tier: 3, riskScore: 26 },
  // South Asia
  { id: "sup-brp", name: "Bharat PCB Works", country: "India", regionId: "reg-sa", tier: 1, riskScore: 30 },
  { id: "sup-lkm", name: "Lanka Magnetics", country: "Sri Lanka", regionId: "reg-sa", tier: 3, riskScore: 61 },
  // Europe
  { id: "sup-bpx", name: "Bavaria Power Electronics", country: "Germany", regionId: "reg-eu", tier: 2, riskScore: 22 },
  { id: "sup-nch", name: "NordChem Electrolytes", country: "Sweden", regionId: "reg-eu", tier: 3, riskScore: 35 },
  { id: "sup-alp", name: "Alpine Optics", country: "Switzerland", regionId: "reg-eu", tier: 2, riskScore: 18 },
  // North America
  { id: "sup-ptx", name: "PhoenixTech SoC Design", country: "USA", regionId: "reg-na", tier: 1, riskScore: 20 },
  { id: "sup-qmn", name: "Quebec Mineral Refining", country: "Canada", regionId: "reg-na", tier: 3, riskScore: 52 },
  { id: "sup-txr", name: "TexRare Earths", country: "USA", regionId: "reg-na", tier: 3, riskScore: 66 },
];

export const components: ComponentSeed[] = [
  // raw / tier-3 materials
  { id: "cmp-lith", name: "Refined Lithium", category: "Raw Material" },
  { id: "cmp-cobalt", name: "Cobalt Cathode", category: "Raw Material" },
  { id: "cmp-electrolyte", name: "Electrolyte Solution", category: "Chemical" },
  { id: "cmp-silicon", name: "Silicon Wafer", category: "Raw Material" },
  { id: "cmp-rareearth", name: "Rare-Earth Magnet Alloy", category: "Raw Material" },
  { id: "cmp-polymer", name: "Engineering Polymer", category: "Raw Material" },
  { id: "cmp-copper", name: "Copper Foil", category: "Raw Material" },
  { id: "cmp-glasssub", name: "Glass Substrate", category: "Raw Material" },
  // sub-assemblies / tier-2
  { id: "cmp-cell", name: "Battery Cell", category: "Energy" },
  { id: "cmp-logicdie", name: "Logic Die", category: "Semiconductor" },
  { id: "cmp-dram", name: "DRAM Die", category: "Semiconductor" },
  { id: "cmp-magnet", name: "Permanent Magnet", category: "Electromechanical" },
  { id: "cmp-pcb", name: "Printed Circuit Board", category: "Electronics" },
  { id: "cmp-oledpanel", name: "OLED Panel", category: "Display" },
  { id: "cmp-lens", name: "Camera Lens Module", category: "Optics" },
  // assemblies / tier-1
  { id: "cmp-battpack", name: "Battery Pack", category: "Energy" },
  { id: "cmp-soc", name: "System-on-Chip", category: "Semiconductor" },
  { id: "cmp-motor", name: "Traction Motor", category: "Electromechanical" },
  { id: "cmp-mainboard", name: "Mainboard", category: "Electronics" },
  { id: "cmp-display", name: "Display Assembly", category: "Display" },
  { id: "cmp-harness", name: "Wiring Harness", category: "Electronics" },
];

export const products: ProductSeed[] = [
  { id: "prd-ev", name: "Aurora EV Sedan", category: "Automotive" },
  { id: "prd-phone", name: "Nimbus Smartphone", category: "Consumer Electronics" },
  { id: "prd-laptop", name: "Stratus Laptop", category: "Consumer Electronics" },
  { id: "prd-ebike", name: "Gale E-Bike", category: "Mobility" },
  { id: "prd-watch", name: "Pulse Smartwatch", category: "Wearables" },
];

export const facilities: FacilitySeed[] = [
  { id: "fac-shz", name: "Shenzhen Mega Assembly", country: "China", regionId: "reg-ea" },
  { id: "fac-pen", name: "Penang Assembly Park", country: "Malaysia", regionId: "reg-sea" },
  { id: "fac-che", name: "Chennai Assembly Line", country: "India", regionId: "reg-sa" },
  { id: "fac-lei", name: "Leipzig Gigafactory", country: "Germany", regionId: "reg-eu" },
];

/** Supplier -SUPPLIES-> Component. A component with a single supplier = SPOF. */
export const supplies: Array<[string, string]> = [
  ["sup-txr", "cmp-lith"],
  ["sup-qmn", "cmp-cobalt"],
  ["sup-nch", "cmp-electrolyte"],
  ["sup-tsc", "cmp-silicon"], // sole supplier of silicon wafers -> SPOF
  ["sup-lkm", "cmp-rareearth"], // sole supplier of rare-earth alloy -> SPOF
  ["sup-thp", "cmp-polymer"],
  ["sup-brp", "cmp-copper"],
  ["sup-skg", "cmp-glasssub"],
  ["sup-cav", "cmp-cell"],
  ["sup-tsc", "cmp-logicdie"], // TaiSilicon also makes logic dies
  ["sup-hyn", "cmp-dram"], // sole DRAM supplier -> SPOF
  ["sup-lkm", "cmp-magnet"],
  ["sup-brp", "cmp-pcb"],
  ["sup-bpx", "cmp-pcb"], // PCB has two suppliers (resilient)
  ["sup-skg", "cmp-oledpanel"],
  ["sup-alp", "cmp-lens"], // sole lens supplier -> SPOF
  ["sup-cav", "cmp-battpack"],
  ["sup-bpx", "cmp-battpack"], // battery pack dual-sourced
  ["sup-ptx", "cmp-soc"], // sole SoC integrator -> SPOF (high impact)
  ["sup-nid", "cmp-motor"],
  ["sup-asg", "cmp-mainboard"],
  ["sup-brp", "cmp-mainboard"],
  ["sup-skg", "cmp-display"],
  ["sup-vnw", "cmp-harness"],
];

/** Component -DEPENDS_ON-> sub-Component (bill-of-materials tree). */
export const dependsOn: Array<[string, string]> = [
  // Battery Cell needs lithium, cobalt, electrolyte
  ["cmp-cell", "cmp-lith"],
  ["cmp-cell", "cmp-cobalt"],
  ["cmp-cell", "cmp-electrolyte"],
  // Battery Pack needs cells + harness
  ["cmp-battpack", "cmp-cell"],
  ["cmp-battpack", "cmp-harness"],
  // Logic Die & DRAM need silicon
  ["cmp-logicdie", "cmp-silicon"],
  ["cmp-dram", "cmp-silicon"],
  // SoC needs logic die + DRAM
  ["cmp-soc", "cmp-logicdie"],
  ["cmp-soc", "cmp-dram"],
  // Magnet needs rare-earth alloy
  ["cmp-magnet", "cmp-rareearth"],
  // Traction Motor needs magnet + copper
  ["cmp-motor", "cmp-magnet"],
  ["cmp-motor", "cmp-copper"],
  // PCB needs copper + polymer
  ["cmp-pcb", "cmp-copper"],
  ["cmp-pcb", "cmp-polymer"],
  // Mainboard needs PCB + SoC
  ["cmp-mainboard", "cmp-pcb"],
  ["cmp-mainboard", "cmp-soc"],
  // OLED panel needs glass substrate
  ["cmp-oledpanel", "cmp-glasssub"],
  // Display assembly needs OLED panel + glass
  ["cmp-display", "cmp-oledpanel"],
  ["cmp-display", "cmp-glasssub"],
  // Camera lens needs polymer
  ["cmp-lens", "cmp-polymer"],
];

/** Component -PART_OF-> Product (top-level bill of materials). */
export const partOf: Array<[string, string]> = [
  // EV Sedan
  ["cmp-battpack", "prd-ev"],
  ["cmp-motor", "prd-ev"],
  ["cmp-mainboard", "prd-ev"],
  ["cmp-display", "prd-ev"],
  ["cmp-harness", "prd-ev"],
  // Smartphone
  ["cmp-mainboard", "prd-phone"],
  ["cmp-display", "prd-phone"],
  ["cmp-lens", "prd-phone"],
  ["cmp-battpack", "prd-phone"],
  // Laptop
  ["cmp-mainboard", "prd-laptop"],
  ["cmp-display", "prd-laptop"],
  ["cmp-battpack", "prd-laptop"],
  // E-Bike
  ["cmp-battpack", "prd-ebike"],
  ["cmp-motor", "prd-ebike"],
  ["cmp-harness", "prd-ebike"],
  // Smartwatch
  ["cmp-mainboard", "prd-watch"],
  ["cmp-display", "prd-watch"],
  ["cmp-battpack", "prd-watch"],
];

/** Product -ASSEMBLED_AT-> Facility. */
export const assembledAt: Array<[string, string]> = [
  ["prd-ev", "fac-lei"],
  ["prd-phone", "fac-shz"],
  ["prd-phone", "fac-pen"],
  ["prd-laptop", "fac-shz"],
  ["prd-ebike", "fac-che"],
  ["prd-watch", "fac-pen"],
];
