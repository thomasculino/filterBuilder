import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import html2canvas from 'html2canvas';
import {
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  IconButton, 
  Paper, 
  Grid, 
  TextField, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Tooltip,
} from '@mui/material';
import { Delete, Settings, Add, ExpandMore, ExpandLess, Save, Clear, Search } from '@mui/icons-material'; // Add Search icon
import { styled } from '@mui/material/styles';
import FilterField from './FilterField';

const filterBlocks = [
  { id: 'rb', label: 'Real/Bogus Score', type: 'range', description: 'ML score indicating if the detected object is real (1) or an artifact (0)', field: 'rb', min: 0, max: 1, step: 0.1 },
  { id: 'drb', label: 'Deep Learning R/B Score', type: 'range', description: 'Deep learning model score for real (1) vs artifact (0) classification', field: 'drb', min: 0, max: 1, step: 0.1 },
  { id: 'galactic_latitude', label: 'Galactic Latitude', type: 'range', description: 'Angular distance from the galactic plane in degrees', field: 'galactic_latitude', min: -90, max: 90, step: 1, hasAbs: true },
  { id: 'jd', label: 'Julian Date', type: 'range', description: 'Julian Date of the detection', field: 'jd', min: 2450000, max: 2459000, step: 1 },
  { id: 'jdstarthist', label: 'Start Julian Date', type: 'range', description: 'Start Julian Date of the detection history', field: 'jdstarthist', min: 2450000, max: 2459000, step: 1 },
];

const operatorBlocks = {
  comparison: [
    { id: 'eq', label: '=', type: 'operator', detail: 'comparison', operator: 'eq', description: 'Equals' },
    { id: 'ne', label: '≠', type: 'operator', detail: 'comparison', operator: 'ne', description: 'Not Equal' },
    { id: 'gt', label: '>', type: 'operator', detail: 'comparison', operator: 'gt', description: 'Greater Than' },
    { id: 'gte', label: '≥', type: 'operator', detail: 'comparison', operator: 'gte', description: 'Greater Than or Equal' },
    { id: 'lt', label: '<', type: 'operator', detail: 'comparison', operator: 'lt', description: 'Less Than' },
    { id: 'lte', label: '≤', type: 'operator', detail: 'comparison', operator: 'lte', description: 'Less Than or Equal' },
  ],
  array: [
    { id: 'in', label: 'in', type: 'operator', detail: 'array', operator: 'in', description: 'In Array' },
    { id: 'nin', label: 'not in', type: 'operator', detail: 'array', operator: 'nin', description: 'Not In Array' },
    { id: 'all', label: 'all', type: 'operator', detail: 'array', operator: 'all', description: 'All Elements Match' },
  ],
  element: [
    { id: 'exists', label: 'exists', type: 'operator', detail: 'element', operator: 'exists', description: 'Field Exists' },
    { id: 'type', label: 'type', type: 'operator', detail: 'element', operator: 'type', description: 'Type Check' },
  ],
  evaluation: [
    { id: 'mod', label: 'mod', type: 'operator', detail: 'evaluation', operator: 'mod', description: 'Modulo' },
    { id: 'regex', label: 'regex', type: 'operator', detail: 'evaluation', operator: 'regex', description: 'Regular Expression' },
  ],
  math: [
    { id: 'add', label: '+', type: 'operator', detail: 'math', operator: 'add', description: 'Addition' },
    { id: 'subtract', label: '-', type: 'operator', detail: 'math', operator: 'subtract', description: 'Subtraction' },
    { id: 'multiply', label: '×', type: 'operator', detail: 'math', operator: 'multiply', description: 'Multiplication' },
    { id: 'divide', label: '÷', type: 'operator', detail: 'math', operator: 'divide', description: 'Division' },
  ],
};

const DraggableItem = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1),
  marginBottom: theme.spacing(0.5),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  cursor: 'grab',
  backgroundColor: theme.palette.grey[50],
  border: `1px solid ${theme.palette.grey[300]}`,
  borderRadius: theme.shape.borderRadius,
  boxShadow: 'none',
  transition: 'all 0.2s ease',
  position: 'relative',
  '& .MuiSvgIcon-root': {
    fontSize: '1.1rem',
    color: theme.palette.grey[400],
  },
  '& .label-container': {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
  '&:hover': {
    backgroundColor: theme.palette.primary.light,
    transform: 'translateX(8px)',
    boxShadow: theme.shadows[2],
    borderColor: theme.palette.primary.main,
    '& .MuiSvgIcon-root': {
      color: theme.palette.primary.main,
    },
  },
  '&:active': {
    cursor: 'grabbing',
  },
}));

const DropZone = styled(Paper)(({ theme, isDragging }) => ({
  minHeight: 700,
  height: '100%',
  border: `2px dashed ${isDragging ? theme.palette.primary.main : theme.palette.grey[300]}`,
  backgroundColor: isDragging ? theme.palette.primary.light + '20' : theme.palette.background.default,
  padding: theme.spacing(3),
  overflowY: 'auto',
  transition: 'all 0.2s ease',
}));

const OperatorButton = styled(Button)(({ theme, selected }) => ({
  marginRight: theme.spacing(1),
  backgroundColor: selected ? theme.palette.primary.main : theme.palette.background.paper,
  color: selected ? theme.palette.primary.contrastText : theme.palette.text.primary,
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: selected ? theme.palette.primary.dark : theme.palette.primary.light,
    transform: 'scale(1.05)',
  },
}));

const SidebarCard = styled(Card)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  transition: 'all 0.2s ease',
  border: `1px solid ${theme.palette.grey[200]}`,
  '&:hover': {
    boxShadow: theme.shadows[4],
    borderColor: theme.palette.primary.main,
  },
}));

const SidebarHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.grey[200]}`,
  backgroundColor: theme.palette.grey[50],
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: theme.spacing(1),
  '& .MuiTypography-root': {
    fontWeight: 600,
    color: theme.palette.grey[800],
  },
  transition: 'all 0.3s ease',
}));

const AnimatedTextField = styled(TextField)(({ theme }) => ({
  flex: 1,
  transition: 'all 0.3s ease, width 0.3s ease',
  width: 0,
  opacity: 0,
  transform: 'scale(0.95)',
  '&.visible': {
    width: '100%',
    opacity: 1,
    transform: 'scale(1)',
  },
}));

const FilterBuilder = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [steps, setSteps] = useState([]);
  const [operators, setOperators] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null);
  const [result, setResult] = useState('');
  const [queryResults, setQueryResults] = useState(null);
  const [isQueryExpanded, setIsQueryExpanded] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [saveError, setSaveError] = useState('');
  const [customFilters, setcustomFilters] = useState([]);
  const [showTooltip, setShowTooltip] = useState(null);
  const [filterSearch, setFilterSearch] = useState('');
  const [operatorSearch, setOperatorSearch] = useState('');
  const [customFilterSearch, setCustomFilterSearch] = useState('');
  const [showFilterSearch, setShowFilterSearch] = useState(false);
  const [showOperatorSearch, setShowOperatorSearch] = useState(false);
  const [showCustomFilterSearch, setShowCustomFilterSearch] = useState(false);
  const saveButtonRef = useRef(null);
  const filterPipelineRef = useRef(null);
  const queryResultsRef = useRef(null);

  useEffect(() => {
    fetchcustomFilters();
  }, []);

  /**
   * Fetches custom filters from the server.
   * @async
   */
  const fetchcustomFilters = async () => {
    try {
      const response = await fetch("http://localhost:5001/get-filters");
      if (response.ok) {
        const filters = await response.json();
        setcustomFilters(filters);
      }
    } catch (error) {
      console.error("Error fetching saved filters:", error);
    }
  };

  /**
   * Checks if the filter is ready to be saved.
   * @returns {boolean} True if the filter is complete, false otherwise.
   */
  const isFilterComplete = () => {
    if (!filterName.trim()) {
      setSaveError('Filter name is required');
      return false;
    }

    for (const step of steps) {
      console.log(step);
      if (!step.isBoolean) {
        if (!step.field || !step.operator || (!step.value && step.value !== undefined)) {
          setSaveError('All steps must have a field, operator, and value');
          return false;
        }
      }
    }

    return true;
  };

  /**
   * Checks if the filter result is boolean based on the steps and operators.
   * @returns {boolean} True if the result is boolean, false otherwise.
   */
  const isBooleanResult = () => {
    for (const step of steps) {
      if (step.operator && ['eq', 'ne', 'gt', 'gte', 'lt', 'lte'].includes(step.operator.operator)) {
        if (step.value !== undefined || step.isValueField) {
          return true;
        }
      }
    }
    return false;
  };

  /**
   * Handles saving the filter to the server.
   * @async
   */
  const handleSaveFilter = async () => {
    if (!isFilterComplete()) {
      return;
    }

    try {
      const canvas = await html2canvas(filterPipelineRef.current);
      const screenshot = canvas.toDataURL();

      const stepsWithBooleanValues = steps.map(step => {
        if (step.isBoolean) {
          return {
            ...step,
            booleanValue: step.booleanValue !== undefined ? step.booleanValue : true
          };
        }
        return step;
      });

      const response = await fetch("http://localhost:5001/save-filter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: filterName,
          description: `Filter with ${steps.length} conditions`,
          steps: stepsWithBooleanValues,
          operators,
          type: 'customFilter',
          screenshot,
          isBoolean: isBooleanResult(), 
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setSaveError(data.error || 'Failed to save filter');
        return;
      }

      setSaveDialogOpen(false);
      setFilterName('');
      setSaveError('');
      await fetchcustomFilters();
    } catch (error) {
      setSaveError('Failed to save filter');
    }
  };

  /**
   * Handles deleting a filter by its ID.
   * @param {string} filterId - The ID of the filter to delete.
   * @async
   */
  const handleDelete = async (filterId) => {
    try {
      const response = await fetch(`http://localhost:5001/delete-filter/${filterId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete filter');
      await fetchcustomFilters();
    } catch (error) {
      console.error('Error deleting filter:', error);
    }
  };

  /**
   * Handles the start of a drag event.
   * @param {Object} block - The block being dragged.
   */
  const handleDragStart = (block) => {
    setDraggedItem(block);
    setIsDragging(true);
    setShowTooltip(false);
  };

  /**
   * Handles the end of a drag event.
   */
  const handleDragEnd = () => {
    setIsDragging(false);
  };

  /**
   * Handles dropping an item in the main filter pipeline zone.
   * @param {Event} e - The drop event.
   */
  const handleDrop = (e) => {
    e.preventDefault();
    const valueDropZone = e.target.closest('.value-drop-zone');
    if (valueDropZone) {
      try {
        const data = JSON.parse(e.dataTransfer.getData('application/json'));
        if (data.type === 'customFilter') {
          const stepIndex = Array.from(valueDropZone.parentNode.parentNode.children).indexOf(valueDropZone.parentNode);
          const parentStep = steps[stepIndex];
          const newSteps = [...steps];
          newSteps[stepIndex] = {
            ...newSteps[stepIndex],
            value: data.isBoolean ? data.label : data.label,
            fieldReference: data._id.$oid || data.id,
            isValueField: false,
            type: 'customFilter',
            parentOperator: parentStep.operator?.operator,
            parentValue: parentStep.value,
            isBoolean: data.isBoolean // Add this line
          };
          setSteps(newSteps);
          return;
        }
      } catch (error) {
        console.error('Failed to parse custom filter data:', error);
      }
    }

    if (draggedItem) {
      if (draggedItem.type === 'operator') return;

      // Find the closest filter step if dropped on an existing one
      const filterField = e.target.closest('.filter-step');
      let insertIndex = steps.length; // Default to end of list

      if (filterField) {
        // Get the index of the filter step we dropped on
        const dropTargetIndex = Array.from(filterField.parentNode.children).indexOf(filterField);
        // If it's not the spacing between steps, adjust the index
        if (dropTargetIndex !== -1) {
          // Calculate the actual index considering the AND/OR dividers
          insertIndex = Math.floor(dropTargetIndex / 2) + 1;
        }
      }

      // Create new step
      const newStep = { 
        ...draggedItem, 
        id: `${draggedItem.id}-${Date.now()}`, 
        operator: null, 
        value: null, 
        isValueField: false
      };

      // Insert the new step at the calculated position
      const newSteps = [...steps];
      newSteps.splice(insertIndex, 0, newStep);
      
      // Add a new operator
      const newOperators = [...operators];
      if (newSteps.length > 1) {
        newOperators.splice(insertIndex - 1, 0, 'AND');
      }

      setSteps(newSteps);
      setOperators(newOperators);
    }
    setDraggedItem(null);
  };

  /**
   * Handles dragging over an element.
   * @param {Event} e - The drag over event.
   */
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  /**
   * Removes a step from the filter pipeline.
   * @param {number} index - The index of the step to remove.
   */
  const removeStep = (index) => {
    const newSteps = [...steps];
    const newOperators = [...operators];
    newSteps.splice(index, 1);
    if (index > 0) newOperators.splice(index - 1, 1);
    else if (newOperators.length > 0) newOperators.splice(0, 1);
    setSteps(newSteps);
    setOperators(newOperators);
  };

  /**
   * Updates a step in the filter pipeline.
   * @param {number} index - The index of the step to update.
   * @param {Object} updates - The updates to apply to the step.
   */
  const updateStep = (index, updates) => {
    const newSteps = [...steps];
    const step = newSteps[index];
    
    // If we're adding an operator to a custom filter step
    if (updates.operator && step.type === 'customFilter') {
      updates.parentOperator = updates.operator.operator;
    }
    
    // If we're updating the value of a custom filter step
    if (updates.value !== undefined && step.type === 'customFilter') {
      updates.parentValue = updates.value;
    }
    
    // If we're adding an operator, set isValueField to true
    if (updates.operator && !step.operator) {
      updates.isValueField = true;
    }
    
    // If we're adding a value source, set isValueField to false
    if (updates.valueSource) {
      updates.isValueField = false;
    }
    
    newSteps[index] = { ...step, ...updates };
    setSteps(newSteps);
  };
  
  /**
   * Builds a query for a single step.
   * @param {Object} step - The step to build the query for.
   * @returns {Object|null} The query object or null if invalid.
   * @async
   */
  const buildStepQuery = async (step) => {
    if (!step || (!step.field && !step.label)) return null;

    // Handle custom filter case first
    if (step.type === 'customFilter') {
      try {
        const response = await fetch(`http://localhost:5001/get-filter/${step.fieldReference || step._id.$oid}`);
        if (!response.ok) throw new Error('Failed to fetch custom filter');
        const customFilter = await response.json();
        
        // Get the base query from the custom filter
        const baseQuery = await buildQuery(customFilter.steps, customFilter.operators);

        // If this custom filter is being used as a value in a comparison
        if (step.parentOperator) {
          return {
            [`$${step.parentOperator}`]: [
              baseQuery,
              step.parentValue ? parseFloat(step.parentValue) : undefined
            ].filter(Boolean)
          };
        }
        
        return baseQuery;
      } catch (error) {
        console.error('Error building custom filter query:', error);
        return null;
      }
    }
  
    // Get field name and operator info
    const fieldName = step.field;
    const operator = step.operator?.operator || step.operator;
    if (!operator) return null;
  
    try {
      switch (step.type) {
        case 'range':
          if (step.operator === 'between') {
            return {
              $and: [
                { $gte: [`$${fieldName}`, parseFloat(step.minValue)] },
                { $lte: [`$${fieldName}`, parseFloat(step.maxValue)] }
              ]
            };
          }
          
          if (step.hasAbs || step.useAbs) {
            return {
              [`$${operator}`]: [
                { $abs: `$${fieldName}` },
                parseFloat(step.value)
              ]
            };
          }
          
          return {
            [`$${operator}`]: [
              `$${fieldName}`,
              !step.isValueField ? `$${step.value}` : parseFloat(step.value)
            ]
          };
          
        case 'computed':
          const operands = step.operands?.map(op => `$${op}`) || [`$${fieldName}`];
          const mathExpression = { [`$${step.operation || operator}`]: operands };
          
          // If this is being compared to a value
          if (step.value !== undefined) {
            return {
              [`$${operator}`]: [
                mathExpression,
                parseFloat(step.value)
              ]
            };
          }
          return mathExpression;
          
        case 'array':
          const arrayValue = !step.isValueField ? `$${step.value}` :
            Array.isArray(step.value) ? step.value : [step.value];
          const arrayExpression = step.operation ? 
            { [`$${step.operation}`]: [`$${fieldName}`] } : 
            `$${fieldName}`;
          return { 
            [`$${operator}`]: [
              arrayExpression,
              arrayValue
            ]
          };
          
        case 'element':
          if (operator === 'exists') {
            return {
              $ifNull: [`$${fieldName}`, false]
            };
          }
          if (operator === 'type') {
            return {
              $type: `$${fieldName}`
            };
          }
          return {
            [`$${operator}`]: [
              `$${fieldName}`,
              !step.isValueField ? `$${step.value}` : step.value
            ]
          };
          
        case 'evaluation':
          if (operator === 'mod') {
            return {
              $mod: [
                `$${fieldName}`,
                !step.isValueField ? `$${step.value}` : parseInt(step.value, 10)
              ]
            };
          }
          if (operator === 'regex') {
            return {
              $regexMatch: {
                input: `$${fieldName}`,
                regex: !step.isValueField ? `$${step.value}` : step.value
              }
            };
          }
          return {
            [`$${operator}`]: [
              `$${fieldName}`,
              !step.isValueField ? `$${step.value}` : step.value
            ]
          };

        default:
          return {
            [`$${operator}`]: [
              `$${fieldName}`,
              !step.isValueField ? `$${step.value}` : 
              !isNaN(step.value) ? parseFloat(step.value) : step.value
            ]
          };
      }
    } catch (error) {
      console.error('Error building step query:', error);
      return null;
    }
  };
  
  /**
   * Builds a query from the steps and operators.
   * @param {Array} steps - The steps to build the query from.
   * @param {Array} operators - The operators to use between steps.
   * @returns {Object|null} The query object or null if invalid.
   * @async
   */
  const buildQuery = async (steps, operators) => {
    if (!steps?.length) return null;
  
    try {
      const conditions = await Promise.all(
        steps.map(async step => {
          const query = await buildStepQuery(step);
          if (!query) return null;  
          return query;
        })
      );
  
      const validConditions = conditions.filter(Boolean);
      if (!validConditions.length) return null;
      if (validConditions.length === 1) return validConditions[0];
  
      return validConditions.reduce((acc, condition, index) => {
        if (index === 0) return condition;
        const logicalOperator = (operators?.[index - 1] || 'AND').toLowerCase();
        return {
          [`$${logicalOperator}`]: [acc, condition]
        };
      });
    } catch (error) {
      console.error('Error building query:', error);
      return null;
    }
  };
  
  /**
   * Builds an aggregation pipeline from the steps and operators.
   * @param {Array} steps - The steps to build the pipeline from.
   * @param {Array} operators - The operators to use between steps.
   * @returns {Array} The aggregation pipeline.
   * @async
   */
  const buildAggregationPipeline = async (steps, operators) => {
    if (!steps?.length) return [];
  
    try {
      const matchCondition = await buildQuery(steps, operators);
      if (!matchCondition) return [];
  
      const pipeline = [
        {
          $match: {
            $expr: matchCondition
          }
        }
      ];
  
      // Add any additional pipeline stages here if needed
      return pipeline;
    } catch (error) {
      console.error('Error building pipeline:', error);
      return [];
    }
  };
  
  /**
   * Runs the MongoDB query and sets the results.
   * @async
   */
  const runMongoQuery = async () => {
    const query = await buildAggregationPipeline(steps, operators);
    setResult(JSON.stringify(query, null, 2));
  
    try {
      const response = await fetch("http://localhost:5001/run-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, isAggregation: true }),
      });
  
      if (!response.ok) throw new Error("Failed to execute query");
  
      const data = await response.json();
      setQueryResults(data.results);

      // Scroll to results after they're loaded
      setTimeout(() => {
        queryResultsRef.current?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);
      
    } catch (error) {
      console.error("Error running query:", error);
      setQueryResults({ error: "Failed to execute query" });
    }
  };

  /**
   * Clears the filter pipeline.
   */
  const clearPipeline = () => {
    setSteps([]);
    setOperators([]);
  };

  /**
   * Updates an operator in the filter pipeline.
   * @param {number} index - The index of the operator to update.
   * @param {string} newOperator - The new operator to set.
   */
  const updateOperator = (index, newOperator) => {
    // Create a copy of the operators array
    const newOperators = [...operators];
    
    // If we're updating an existing operator
    if (index < newOperators.length) {
      newOperators[index] = newOperator;
    } 
    // If we need to add a new operator
    else if (index === newOperators.length) {
      newOperators.push(newOperator);
    }
    
    // Update operators maintaining proper connections between steps
    const adjustedOperators = newOperators.map((op) => {
      // Keep consistent operator formatting
      if (typeof op === 'string') {
        return op.toUpperCase();
      }
      return op;
    });
    
    // Ensure there are enough operators for the number of steps
    while (adjustedOperators.length < steps.length - 1) {
      adjustedOperators.push('AND');
    }
    
    // Remove extra operators if there are too many
    if (adjustedOperators.length >= steps.length) {
      adjustedOperators.length = Math.max(0, steps.length - 1);
    }
    
    setOperators(adjustedOperators);
  };

  const filteredFilterBlocks = filterBlocks.filter(block => block.label.toLowerCase().includes(filterSearch.toLowerCase()));
  const filteredOperatorBlocks = Object.entries(operatorBlocks).reduce((acc, [category, operators]) => {
    const filteredOperators = operators.filter(op => op.label.toLowerCase().includes(operatorSearch.toLowerCase()));
    if (filteredOperators.length) acc[category] = filteredOperators;
    return acc;
  }, {});
  const filteredCustomFilters = customFilters.filter(filter => filter.label.toLowerCase().includes(customFilterSearch.toLowerCase()));

  return (
    <Box sx={{ p: 4, maxWidth: '1400px', margin: '0 auto' }}>
      <Grid container spacing={4}>
        <Grid item xs={3}>
          <SidebarCard elevation={0} sx={{ mb: 2 }}>
            <SidebarHeader>
              {!showFilterSearch && 
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Filters</Typography>
              }
              <AnimatedTextField
                size="small"
                placeholder="Search filters"
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                className={showFilterSearch ? 'visible' : ''}
              />
              <IconButton onClick={() => setShowFilterSearch(!showFilterSearch)}>
                <Search />
              </IconButton>
            </SidebarHeader>
            <CardContent sx={{ 
              p: 1.5,
              maxHeight: '300px',
              overflowY: 'auto',
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                background: theme => theme.palette.grey[300],
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: theme => theme.palette.grey[400],
              },
            }}>
              {filteredFilterBlocks.map((block) => (
                <Tooltip key={block.id} title={block.description} placement="right" arrow 
                  PopperProps={{ 
                    sx: { 
                      "& .MuiTooltip-tooltip": { 
                        bgcolor: "background.paper", 
                        color: "text.primary", 
                        boxShadow: 2, 
                        fontSize: "0.75rem", 
                        border: "1px solid", 
                        borderColor: "divider", 
                        maxWidth: 220, 
                        p: 1.5,
                        '& p': {
                          mb: 0
                        }
                      } 
                    } 
                  }}
                >
                  <DraggableItem elevation={0} 
                    draggable 
                    onDragStart={(e) => { 
                      e.dataTransfer.setData('application/json', JSON.stringify(block)); 
                      handleDragStart(block); 
                    }} 
                    onDragEnd={handleDragEnd}
                    sx={{
                      mb: 1,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateX(4px)',
                        bgcolor: 'primary.lighter',
                      }
                    }}
                  >
                    <Box className="label-container">
                      <Typography variant="subtitle2" sx={{ 
                        fontSize: '0.875rem', 
                        fontWeight: 500,
                        color: 'grey.800'
                      }}>
                        {block.label}
                      </Typography>
                    </Box>
                  </DraggableItem>
                </Tooltip>
              ))}
            </CardContent>
          </SidebarCard>

          <SidebarCard elevation={0} sx={{ mb: 2 }}>
            <SidebarHeader>
            {!showOperatorSearch && 
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Operators</Typography>
              }
              <AnimatedTextField
                size="small"
                placeholder="Search operators"
                value={operatorSearch}
                onChange={(e) => setOperatorSearch(e.target.value)}
                className={showOperatorSearch ? 'visible' : ''}
              />
              <IconButton onClick={() => setShowOperatorSearch(!showOperatorSearch)}>
                <Search />
              </IconButton>
            </SidebarHeader>
            <CardContent sx={{ 
              p: 1.5,
              maxHeight: '400px',
              overflowY: 'auto',
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                background: theme => theme.palette.grey[300],
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: theme => theme.palette.grey[400],
              },
            }}>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                {Object.entries(filteredOperatorBlocks).map(([category, operators]) => (
                  <Box key={category} sx={{ mb: 3, '&:last-child': { mb: 0 } }}>
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        mb: 1.5,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: 'primary.main',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        paddingLeft: 1
                      }}
                    >
                      {category}
                    </Typography>
                    <Box sx={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(3, 1fr)', 
                      gap: 1 
                    }}>
                      {operators.map((block) => (
                        <Tooltip key={block.id} title={block.description} placement="top">
                          <DraggableItem 
                            elevation={0}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('application/json', JSON.stringify(block));
                              handleDragStart(block);
                            }}
                            onDragEnd={handleDragEnd}
                            sx={{
                              mb: 0,
                              justifyContent: 'center',
                              minHeight: 16,
                              bgcolor: 'grey.50',
                              '&:hover': {
                                bgcolor: 'primary.lighter',
                                transform: 'scale(1.05)',
                              }
                            }}
                          >
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontSize: '0.875rem',
                                fontWeight: 300,
                                fontFamily: 'monospace'
                              }}
                            >
                              {block.label}
                            </Typography>
                          </DraggableItem>
                        </Tooltip>
                      ))}
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </SidebarCard>
        </Grid>

        <Grid item xs={6}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Filter Pipeline</Typography>
                </Box>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  '& > :not(:first-child)': { ml: 1 },
                  '& .MuiButton-root': {
                    minHeight: 40,
                    px: 2,
                    mr: 2, 
                  },
                  '& .MuiIconButton-root': {
                    width: 40,
                    height: 40,
                  }
                }}>
                  <Button 
                    variant="contained" 
                    onClick={runMongoQuery} 
                    startIcon={<Settings />} 
                    color="primary"
                    size="small"
                    disabled={steps.length === 0}
                  >
                    Run
                  </Button>
                  <IconButton onClick={() => setSaveDialogOpen(true)} disabled={steps.length === 0} color="primary">
                    <Save />
                  </IconButton>
                  <IconButton onClick={clearPipeline} disabled={steps.length === 0} color="secondary">
                    <Clear />
                  </IconButton>
                </Box>
              </Box>
              <DropZone onDrop={handleDrop} onDragOver={handleDragOver} isDragging={isDragging} onDragEnd={handleDragEnd} ref={filterPipelineRef}>
                {steps.length === 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.secondary' }}>
                    <Add sx={{ fontSize: 48, mb: 1 }} />
                    <Typography>Drag and drop filters here to build your query</Typography>
                  </Box>
                ) : (
                  steps.map((step, index) => (
                    <>
                      {index > 0 && (
                        <Box sx={{ my: 2, textAlign: 'center' }}>
                          <OperatorButton variant="outlined" size="small" selected={operators[index - 1] === 'AND'} onClick={() => updateOperator(index - 1, 'AND')}>AND</OperatorButton>
                          <OperatorButton variant="outlined" size="small" selected={operators[index - 1] === 'OR'} onClick={() => updateOperator(index - 1, 'OR')}>OR</OperatorButton>
                        </Box>
                      )}
                      <FilterField
                        field={step}
                        fieldIndex={index}
                        onUpdate={(updates) => updateStep(index, updates)}
                        onRemove={() => removeStep(index)}
                      />
                    </>
                  ))
                )}
              </DropZone>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={3}>
          <SidebarCard elevation={0}>
            <SidebarHeader>
            {!showCustomFilterSearch && 
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Custom Filters</Typography>
              }
              <AnimatedTextField
                size="small"
                placeholder="Search custom filters"
                value={customFilterSearch}
                onChange={(e) => setCustomFilterSearch(e.target.value)}
                className={showCustomFilterSearch ? 'visible' : ''}
              />
              <IconButton onClick={() => setShowCustomFilterSearch(!showCustomFilterSearch)}>
                <Search />
              </IconButton>
            </SidebarHeader>
            <CardContent sx={{ 
              p: 1.5,
              maxHeight: '300px',
              overflowY: 'auto',
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                background: theme => theme.palette.grey[300],
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: theme => theme.palette.grey[400],
              },
            }}>
              {filteredCustomFilters.map((filter) => (
                <Tooltip
                  key={filter._id.$oid}
                  title={<img src={filter.screenshot} 
                  alt={filter.description} 
                  style={{ width: '100%' }} />}
                  placement="right"
                  PopperProps={{
                    sx: {
                      "& .MuiTooltip-tooltip": {
                        bgcolor: "background.paper",
                        color: "text.primary",
                        boxShadow: 2,
                        fontSize: "0.75rem",
                        border: "1px solid",
                        borderColor: "divider",
                        maxWidth: 500,
                        p: 1,
                        maxHeight: 450,
                        overflowY: 'auto'
                      }
                    }
                  }}
                  open={showTooltip === filter._id} 
                  onOpen={() => setShowTooltip(filter._id)} 
                  onClose={() => setShowTooltip(null)}
                >
                  <DraggableItem
                    elevation={0}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/json', JSON.stringify(filter));
                      handleDragStart(filter);
                    }}
                    onDragEnd={handleDragEnd}
                    sx={{
                      mb: 1,
                      p: 1.5,
                      '&:hover': {
                        transform: 'translateX(4px)',
                        bgcolor: 'primary.lighter',
                      }
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        mb: 0.5
                      }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {filter.label}
                        </Typography>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(filter._id.$oid)}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </Box>
                  </DraggableItem>
                </Tooltip>
              ))}
            </CardContent>
          </SidebarCard>
        </Grid>
      </Grid>

      {queryResults && (
        <Card elevation={3} sx={{ mt: 4, mb: 2 }} ref={queryResultsRef}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Query Results</Typography>
              <Typography variant="body2" color="text.secondary">{Array.isArray(queryResults) ? `${queryResults.length} results found` : ''}</Typography>
            </Box>
            <Paper sx={{ p: 3, backgroundColor: '#002b36', color: '#839496', maxHeight: '300px', overflow: 'auto', fontFamily: 'monospace', fontSize: '0.9rem', borderRadius: 2 }}>
              {queryResults.error ? (
                <Typography color="error">{queryResults.error}</Typography>
              ) : (
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{JSON.stringify(queryResults, null, 2)}</pre>
              )}
            </Paper>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card elevation={3} sx={{ mt: 4 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: isQueryExpanded ? 2 : 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6">Generated MongoDB Query</Typography>
                <IconButton onClick={() => setIsQueryExpanded(!isQueryExpanded)} size="small">
                  {isQueryExpanded ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </Box>
              <Button variant="outlined" size="small" onClick={() => { navigator.clipboard.writeText(result); }}>
                Copy Query
              </Button>
            </Box>
            <Box sx={{ height: isQueryExpanded ? 'auto' : '0px', overflow: 'hidden', transition: 'height 0.3s ease' }}>
              <Paper sx={{ p: 3, mt: 2, backgroundColor: '#002b36', color: '#839496', maxHeight: isQueryExpanded ? '500px' : '0px', overflow: 'auto', fontFamily: 'monospace', fontSize: '0.9rem', borderRadius: 2, transition: 'all 0.3s ease' }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{result}</pre>
              </Paper>
            </Box>
          </CardContent>
        </Card>
      )}

      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)} inert={!saveDialogOpen}>
        <DialogTitle>Save Filter</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" label="Filter Name" fullWidth value={filterName} onChange={(e) => setFilterName(e.target.value)} error={!!saveError} helperText={saveError} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveFilter} variant="contained" ref={saveButtonRef}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

FilterBuilder.propTypes = {
  steps: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      description: PropTypes.string,
      field: PropTypes.string,
      min: PropTypes.number,
      max: PropTypes.number,
      step: PropTypes.number,
      hasAbs: PropTypes.bool,
      operator: PropTypes.object,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      isValueField: PropTypes.bool,
      valueSource: PropTypes.object,
      valueType: PropTypes.string,
      parentOperator: PropTypes.string,
      parentValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    })
  ),
  operators: PropTypes.arrayOf(PropTypes.string),
  customFilters: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.shape({
        $oid: PropTypes.string.isRequired,
      }).isRequired,
      label: PropTypes.string.isRequired,
      description: PropTypes.string,
      steps: PropTypes.array,
      operators: PropTypes.array,
      type: PropTypes.string,
      screenshot: PropTypes.string,
    })
  ),
};

export default FilterBuilder;