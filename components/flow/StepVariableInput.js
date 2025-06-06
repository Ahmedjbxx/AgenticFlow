import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Mention, MentionsInput as ReactMentionsInput } from 'react-mentions';
export const StepVariableInput = ({ value, onChange, availableSteps, placeholder = "Type $ to reference data from previous steps...", rows = 4, disabled = false, label, helpText, className = '', }) => {
    // Convert step variables to react-mentions format
    const mentionSuggestions = React.useMemo(() => {
        const suggestions = [];
        availableSteps.forEach(step => {
            step.fields.forEach(field => {
                suggestions.push({
                    id: `${step.stepId}.${field.name}`,
                    display: `Step ${step.stepId}: ${field.name}`,
                    stepId: step.stepId,
                    stepLabel: step.stepLabel,
                    stepType: step.stepType,
                    fieldName: field.name,
                    fieldType: field.type,
                    description: field.description,
                    example: field.example,
                });
            });
        });
        return suggestions;
    }, [availableSteps]);
    // Enhanced suggestion renderer
    const renderSuggestion = (suggestion, search, highlightedDisplay) => {
        const actualValue = getActualValue(suggestion.stepId, suggestion.fieldName);
        return (_jsx("div", { className: "px-3 py-2 cursor-pointer hover:bg-blue-50 border-b border-gray-100", children: _jsxs("div", { className: "flex items-start space-x-3", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx("div", { className: "w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium", children: suggestion.stepId }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center space-x-2 mb-1", children: [_jsx("code", { className: "text-sm font-medium text-blue-900 bg-blue-100 px-2 py-0.5 rounded", children: suggestion.fieldName }), _jsx("span", { className: "text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded", children: suggestion.fieldType })] }), _jsxs("div", { className: "flex items-center space-x-2 mb-1", children: [_jsx("span", { className: "text-xs text-blue-600 font-medium", children: suggestion.stepLabel }), _jsx("span", { className: "text-xs text-gray-400", children: "\u2022" }), _jsx("span", { className: "text-xs text-gray-500", children: suggestion.stepType })] }), suggestion.description && (_jsx("p", { className: "text-xs text-gray-600 mb-2", children: suggestion.description })), (actualValue !== undefined || suggestion.example !== undefined) && (_jsxs("div", { className: "mt-1", children: [_jsx("span", { className: "text-xs text-gray-500", children: actualValue !== undefined ? 'Current: ' : 'Example: ' }), _jsx("code", { className: "text-xs px-1.5 py-0.5 rounded max-w-xs truncate inline-block bg-yellow-50 text-yellow-800", children: formatDisplayValue(actualValue !== undefined ? actualValue : suggestion.example) })] })), _jsxs("div", { className: "mt-1", children: [_jsx("span", { className: "text-xs text-gray-400", children: "Use: " }), _jsx("code", { className: "text-xs font-mono text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded", children: `{{${suggestion.id}}}` })] })] })] }) }));
    };
    // Get actual value from step output
    const getActualValue = (stepId, fieldName) => {
        const step = availableSteps.find(s => s.stepId === stepId);
        if (step?.output && typeof step.output === 'object') {
            return step.output[fieldName];
        }
        return undefined;
    };
    // Format display value for different types
    const formatDisplayValue = (value) => {
        if (value === null)
            return 'null';
        if (value === undefined)
            return 'undefined';
        if (typeof value === 'string') {
            return value.length > 30 ? value.substring(0, 30) + '...' : value;
        }
        if (typeof value === 'object') {
            try {
                const jsonStr = JSON.stringify(value);
                return jsonStr.length > 30 ? jsonStr.substring(0, 30) + '...' : jsonStr;
            }
            catch {
                return '[object]';
            }
        }
        return String(value);
    };
    // Mention style
    const mentionStyle = {
        backgroundColor: '#e0e7ff',
        color: '#3730a3',
        padding: '1px 4px',
        borderRadius: '3px',
        fontWeight: '500',
    };
    return (_jsxs("div", { className: `space-y-2 ${className}`, children: [label && (_jsx("label", { className: "block text-sm font-medium text-gray-700", children: label })), _jsx("div", { className: "relative", children: _jsx(ReactMentionsInput, { value: value, onChange: (e) => onChange(e.target.value), placeholder: placeholder, disabled: disabled, style: {
                        control: {
                            fontSize: 14,
                            fontWeight: 'normal',
                        },
                        '&multiLine': {
                            control: {
                                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                minHeight: `${rows * 1.5}rem`,
                                padding: '8px 12px',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                background: disabled ? '#f9fafb' : '#ffffff',
                            },
                            highlighter: {
                                padding: '8px 12px',
                                border: '1px solid transparent',
                            },
                            input: {
                                padding: '8px 12px',
                                border: '1px solid transparent',
                                outline: 'none',
                                resize: 'vertical',
                            },
                        },
                        suggestions: {
                            list: {
                                backgroundColor: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                fontSize: 14,
                                maxHeight: '200px',
                                overflowY: 'auto',
                                zIndex: 1000,
                            },
                            item: {
                                padding: 0,
                                '&focused': {
                                    backgroundColor: '#eff6ff',
                                },
                            },
                        },
                    }, a11ySuggestionsListLabel: "Suggested step variables", children: _jsx(Mention, { trigger: "$", data: mentionSuggestions, renderSuggestion: renderSuggestion, style: mentionStyle, markup: "{{__id__}}", displayTransform: (id) => `{{${id}}}`, appendSpaceOnAdd: false }) }) }), helpText && (_jsx("p", { className: "text-sm text-gray-500", children: helpText })), _jsxs("div", { className: "text-xs text-gray-400", children: [_jsx("span", { className: "font-medium", children: "Tip:" }), " Type ", _jsx("code", { className: "bg-gray-100 px-1 rounded", children: "$" }), " to reference data from previous steps"] })] }));
};
//# sourceMappingURL=StepVariableInput.js.map