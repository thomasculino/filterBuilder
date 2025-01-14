import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  IconButton,
  FormControlLabel,
  TextField,
  Checkbox,
  Paper,
} from '@mui/material';
import {
  Delete,
  Add,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const FilterStep = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(3),
    marginBottom: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
    borderLeft: `4px solid ${theme.palette.primary.main}`,
    transition: 'all 0.2s ease',
    '&:hover': {
      boxShadow: theme.shadows[4],
      transform: 'translateX(4px)',
    },
  }));

const ValueDropZone = styled(Box)(({ theme, isDraggingOver }) => ({
  flex: 1,
  maxWidth: 200,
  minHeight: 32,
  border: `2px dashed ${isDraggingOver ? theme.palette.secondary.main : theme.palette.grey[300]}`,
  borderRadius: theme.shape.borderRadius,
  backgroundColor: isDraggingOver ? theme.palette.secondary.light + '20' : theme.palette.background.paper,
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0.5, 1),
  transition: 'all 0.2s ease',
  cursor: 'pointer',
  '&:hover': {
    borderColor: theme.palette.secondary.main,
    backgroundColor: theme.palette.secondary.light + '10',
  }
}));

/**
 * Component for rendering a filter field.
 * @param {Object} props - The component props.
 * @param {Object} props.field - The field data.
 * @param {Function} props.onUpdate - The function to call when updating the field.
 * @param {Function} props.onRemove - The function to call when removing the field.
 */
const FilterField = ({ field, onUpdate, onRemove }) => {
    const [isDraggingOverValue, setIsDraggingOverValue] = useState(false);
    const [isDraggingOverOperator, setIsDraggingOverOperator] = useState(false);
    const [isValueField, setIsValueField] = useState(field.isValueField || true);
  
    /**
     * Handles dropping an operator.
     * @param {Event} e - The drop event.
     */
    const handleOperatorDrop = (e) => {
      e.preventDefault();
      setIsDraggingOverOperator(false);
      try {
        const operatorData = JSON.parse(e.dataTransfer.getData('application/json'));
        if (operatorData.type === 'operator') {
          onUpdate({ operator: operatorData });
        }
      } catch (error) {
        console.error('Failed to parse operator data:', error);
      }
    };
  
    /**
     * Handles dropping a value in the drop filter zone.
     * @param {Event} e - The drop event.
     */
    const handleValueDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingOverValue(false);
    
      try {
        const data = JSON.parse(e.dataTransfer.getData('application/json'));
        if (data.field || data.type === 'customFilter') {
          const value = data.field || data._id.$oid;
          onUpdate({ 
            value: data.field,
            fieldReference: value,
            isValueField: false,
            valueSource: data,
            valueType: data.type
          });
          setIsValueField(false);
        }
      } catch (error) {
        console.error('Failed to parse value data:', error);
      }
    };

    /**
     * Handles dropping a field.
     * @param {Event} e - The drop event.
     * @param {Object} targetField - The target field data.
     */
    const handleFieldDrop = (e, targetField) => {
      e.preventDefault();
      try {
        const data = JSON.parse(e.dataTransfer.getData('application/json'));
        if (data.type === 'field') {
          onUpdate({ field: data.field });
          targetField.onUpdate({ field: data.field });
        }
      } catch (error) {
        console.error('Failed to parse field data:', error);
      }
    };
  
    /**
     * Handles dragging over a value drop zone.
     * @param {Event} e - The drag over event.
     */
    const handleValueDragOver = (e) => {
      e.preventDefault();
      setIsDraggingOverValue(true);
    };
  
    /**
     * Handles leaving a value drop zone.
     */
    const handleValueDragLeave = () => {
      setIsDraggingOverValue(false);
    };
  
    /**
     * Clears the value of the field.
     */
    const handleClearValue = () => {
      onUpdate({ 
        value: '',
        isValueField: true,
        valueSource: null
      });
      setIsValueField(true);
    };

    /**
     * Handles the start of a drag event.
     * @param {Event} e - The drag event.
     */
    const handleDragStart = (e) => {
      e.dataTransfer.setData('application/json', JSON.stringify(field.valueSource));
      e.dataTransfer.effectAllowed = 'move';
      e.target.style.opacity = '0.5';
      e.target.style.transform = 'scale(0.8)';
    };

    /**
     * Handles the end of a drag event.
     * @param {Event} e - The drag event.
     */
    const handleDragEnd = (e) => {
      e.target.style.opacity = '1';
      e.target.style.transform = 'scale(1)';
    };
  
    return (
      <FilterStep className="filter-step" elevation={1} sx={{ 
        p: 1.5,
        bgcolor: 'pipeline.background',
        borderLeft: '4px solid',
        borderColor: 'primary.main',
        '&:hover': {
          borderColor: 'primary.dark',
        }
      }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: 1.5,
            p: 1,
            bgcolor: 'grey.50',
            borderRadius: 1,
            justifyContent: 'space-between' // Add this line to ensure the delete button is on the right
          }}>
            <Box
              sx={{ 
                display: 'flex',
                alignItems: 'center',
                px: 1.5,
                py: 0.75,
                bgcolor: 'pipeline.field',
                color: 'pipeline.text.light',
                borderRadius: '4px',
                minWidth: 100,
                boxShadow: 1,
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                fontWeight: 500,
              }}
              draggable
              onDrop={(e) => handleFieldDrop(e, field)}
              onDragOver={(e) => e.preventDefault()}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'pipeline.text.muted',
                    fontSize: '0.875rem',
                    fontWeight: 500 
                  }}
                >
                  {field.label}
                </Typography>
            </Box>
  
            {!field.operator ? (
              <Box 
                sx={{ 
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  px: 2,
                  py: 1,
                  border: '1.5px dashed',
                  borderColor: 'grey.400',
                  borderRadius: '4px',
                  bgcolor: 'pipeline.dropZone',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'pipeline.dropZone',
                    borderStyle: 'solid',
                  },
                  fontFamily: 'monospace',
                }}
                onDrop={handleOperatorDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'pipeline.text.muted',
                    fontSize: '0.75rem',
                    fontWeight: 500 
                  }}
                >
                  Drop operator here
                </Typography>
              </Box>
            ) : (
              <>
                <Box 
                  sx={{ 
                    px: 1.5,
                    py: 0.75,
                    bgcolor: isDraggingOverOperator ? 'pipeline.operatorHover' : 'pipeline.operator',
                    color: 'pipeline.text.light',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    minWidth: 40,
                    textAlign: 'center',
                    boxShadow: 1,
                    transition: 'background-color 0.2s ease, transform 0.2s ease',
                    transform: isDraggingOverOperator ? 'scale(1.05)' : 'scale(1)'
                  }}
                  onDrop={handleOperatorDrop}
                >
                  {field.operator.label}
                </Box>
                {!isValueField ? (
                    <Box 
                      sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        px: 1.5,
                        py: 0.75,
                        bgcolor: 'pipeline.field',
                        color: 'pipeline.text.light',
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        minWidth: 100,
                        boxShadow: 1
                      }}
                      draggable
                      onDrop={(e) => handleValueDrop(e)}
                      onDragStart={handleDragStart}
                      onDragEnd={(e) => {
                        handleClearValue();
                        handleDragEnd(e);
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {field.valueSource?.label}
                      </Typography>
                    </Box>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <TextField
                      size="small"
                      type="number"
                      value={field.value || ''}
                      onChange={(e) => onUpdate({ value: e.target.value })}
                      placeholder="Value"
                      sx={{
                        width: 150,
                        '& .MuiOutlinedInput-root': {
                          height: 32,
                          bgcolor: 'pipeline.background'
                        }
                      }}
                      inputProps={{
                        min: field.min,
                        max: field.max,
                        step: field.step
                      }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      or
                    </Typography>
                    <ValueDropZone
                      className="value-drop-zone"
                      isDraggingOver={isDraggingOverValue}
                      onDrop={handleValueDrop}
                      onDragOver={handleValueDragOver}
                      onDragLeave={handleValueDragLeave}
                    >
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        gap: 0.5,
                        color: 'text.secondary'
                      }}>
                        <Add fontSize="small" />
                        <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                          Drop filter
                        </Typography>
                      </Box>
                    </ValueDropZone>
                  </Box>
                )}
              </>
            )}
            <IconButton 
              size="small" 
              onClick={onRemove}
              sx={{ 
                p: 0.5,
                '&:hover': { color: 'error.main' }
              }}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Box>
  
          {field.hasAbs && (
            <FormControlLabel
              sx={{ 
                ml: 0,
                mt: -0.5,
                '& .MuiTypography-root': {
                  fontSize: '0.75rem',
                  color: 'text.secondary'
                }
              }}
              control={
                <Checkbox
                  size="small"
                  checked={field.useAbs || false}
                  onChange={(e) => onUpdate({ useAbs: e.target.checked })}
                  sx={{ p: 0.5, ml: 0.5 }}
                />
              }
              label="Use absolute value"
            />
          )}
        </Box>
      </FilterStep>
    );
  };

FilterField.propTypes = {
  field: PropTypes.shape({
    label: PropTypes.string.isRequired,
    operator: PropTypes.object,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    isValueField: PropTypes.bool,
    valueSource: PropTypes.object,
    hasAbs: PropTypes.bool,
    useAbs: PropTypes.bool,
    min: PropTypes.number,
    max: PropTypes.number,
    step: PropTypes.number,
  }).isRequired,
  onUpdate: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
};

export default FilterField;