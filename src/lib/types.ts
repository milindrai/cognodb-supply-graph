/** Shared domain types for the Supply Chain Impact & Resilience Graph. */

export type RiskTier = "low" | "medium" | "high";

export interface SupplierSummary {
  id: string;
  name: string;
  country: string;
  region: string;
  tier: number; // 1 = direct, 2 = sub-supplier, ...
  riskScore: number; // 0-100
}

export interface ProductSummary {
  id: string;
  name: string;
  category: string;
}

export interface ComponentSummary {
  id: string;
  name: string;
  category: string;
}

/** A product exposed to a disruption, with how many hops away the cause is. */
export interface ImpactedProduct {
  id: string;
  name: string;
  category: string;
  hops: number; // shortest dependency distance from the disrupted node
  viaComponents: string[]; // component names on the path
}

/** Result of a supplier/region disruption simulation. */
export interface ImpactResult {
  sourceType: "supplier" | "region";
  sourceId: string;
  sourceName: string;
  impactedProducts: ImpactedProduct[];
  impactedComponentCount: number;
  totalProducts: number;
}

/** A single-point-of-failure: a component with only one qualified supplier. */
export interface SpofComponent {
  componentId: string;
  componentName: string;
  category: string;
  soleSupplier: string;
  soleSupplierCountry: string;
  dependentProductCount: number;
  dependentProducts: string[];
}

/** A node/edge pair for the graph explorer visualisation. */
export interface GraphNode {
  id: string;
  label: string; // node caption
  type: "Supplier" | "Component" | "Product" | "Facility" | "Region";
  meta?: Record<string, string | number>;
}
export interface GraphEdge {
  source: string;
  target: string;
  type: string;
}
export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface Stats {
  suppliers: number;
  components: number;
  products: number;
  facilities: number;
  regions: number;
  relationships: number;
}
