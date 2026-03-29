export type DesignerNodeType = 'input' | 'factor' | 'calculation' | 'aggregation' | 'comparison' | 'output';

export type NodeTypeDef = {
  label: string;
  color: string;
  borderColor: string;
  icon: string;
  subtypes: { value: string; label: string }[];
};

export const NODE_TYPE_DEFS: Record<DesignerNodeType, NodeTypeDef> = {
  input: {
    label: 'Input',
    color: '#f6ffed',
    borderColor: '#52c41a',
    icon: 'DatabaseOutlined',
    subtypes: [
      { value: 'user_input', label: 'User Input' },
      { value: 'project_data', label: 'Project Data' },
      { value: 'api_data', label: 'API Data' },
      { value: 'imported_data', label: 'Imported Data' },
      { value: 'baseline_purchasing', label: 'Baseline Purchasing' },
      { value: 'forecast_purchasing', label: 'Forecast Purchasing' }
    ]
  },
  factor: {
    label: 'Factor',
    color: '#e6f4ff',
    borderColor: '#1677ff',
    icon: 'ExperimentOutlined',
    subtypes: [
      { value: 'emission_factor', label: 'Emission Factor' },
      { value: 'grid_intensity', label: 'Grid Intensity' },
      { value: 'utility_rate', label: 'Utility Rate' },
      { value: 'material_property', label: 'Material Property' },
      { value: 'lifespan_assumption', label: 'Lifespan Assumption' }
    ]
  },
  calculation: {
    label: 'Calculation',
    color: '#fff7e6',
    borderColor: '#fa8c16',
    icon: 'FunctionOutlined',
    subtypes: []
  },
  aggregation: {
    label: 'Aggregation',
    color: '#fff0f6',
    borderColor: '#eb2f96',
    icon: 'MergeCellsOutlined',
    subtypes: [
      { value: 'sum', label: 'Sum' },
      { value: 'group', label: 'Group By' },
      { value: 'merge', label: 'Merge' },
      { value: 'normalize', label: 'Normalize' },
      { value: 'total_by_category', label: 'Total by Category' }
    ]
  },
  comparison: {
    label: 'Comparison',
    color: '#fff1f0',
    borderColor: '#ff4d4f',
    icon: 'SwapOutlined',
    subtypes: [
      { value: 'baseline_vs_forecast', label: 'Baseline vs Forecast' },
      { value: 'scenario_a_vs_b', label: 'Scenario A vs B' },
      { value: 'before_vs_after', label: 'Before vs After' }
    ]
  },
  output: {
    label: 'Output',
    color: '#f9f0ff',
    borderColor: '#722ed1',
    icon: 'BarChartOutlined',
    subtypes: [
      { value: 'metric', label: 'Metric' },
      { value: 'dataset', label: 'Dataset' },
      { value: 'dashboard_feed', label: 'Dashboard Feed' },
      { value: 'report', label: 'Report Output' },
      { value: 'chart_output', label: 'Chart Output' }
    ]
  }
};

export const DESIGNER_NODE_WIDTH = 200;
export const DESIGNER_NODE_HEIGHT = 80;
