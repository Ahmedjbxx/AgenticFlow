
import { FlowData, CustomNodeType, PredefinedTemplate, TriggerNodeData, LLMAgentNodeData, ConditionNodeData, ToolActionNodeData, EndNodeData } from '../types';
import { GEMINI_MODEL_NAME } from '../constants';
import { MarkerType } from 'reactflow';

export const loadLeadQualificationTemplate = (): PredefinedTemplate => {
  const nodes: FlowData['nodes'] = [
    {
      id: 'trigger_lead',
      type: CustomNodeType.TRIGGER,
      position: { x: 50, y: 150 },
      data: {
        id: 'trigger_lead',
        type: CustomNodeType.TRIGGER,
        label: 'New Contact Received',
        triggerType: 'New Contact CRM Entry',
      } as TriggerNodeData,
    },
    {
      id: 'llm_qualify',
      type: CustomNodeType.LLM_AGENT,
      position: { x: 300, y: 150 },
      data: {
        id: 'llm_qualify',
        type: CustomNodeType.LLM_AGENT,
        label: 'Qualify Lead',
        prompt: `Based on the following contact description, determine if this lead is qualified. A qualified lead typically shows strong interest in our services (e.g., mentions specific needs we address, has budget authority, or requests a demo). Output JSON: {"isQualified": boolean, "reason": "brief explanation", "contactName": "{input.name}", "contactEmail": "{input.email}"}. Contact Description: {input.description}`,
        model: GEMINI_MODEL_NAME,
      } as LLMAgentNodeData,
    },
    {
      id: 'condition_isQualified',
      type: CustomNodeType.CONDITION,
      position: { x: 550, y: 150 },
      data: {
        id: 'condition_isQualified',
        type: CustomNodeType.CONDITION,
        label: 'Is Qualified?',
        conditionLogic: 'input.isQualified === true',
      } as ConditionNodeData,
    },
    {
      id: 'tool_addToCRM',
      type: CustomNodeType.TOOL_ACTION,
      position: { x: 800, y: 50 },
      data: {
        id: 'tool_addToCRM',
        type: CustomNodeType.TOOL_ACTION,
        label: 'Add to Qualified CRM',
        toolName: 'Add to CRM (Qualified Leads)',
      } as ToolActionNodeData,
    },
    {
      id: 'tool_sendFollowUp',
      type: CustomNodeType.TOOL_ACTION,
      position: { x: 800, y: 250 },
      data: {
        id: 'tool_sendFollowUp',
        type: CustomNodeType.TOOL_ACTION,
        label: 'Send Nurturing Email',
        toolName: 'Send Follow-up Email',
      } as ToolActionNodeData,
    },
     {
      id: 'end_crm',
      type: CustomNodeType.END,
      position: { x: 1050, y: 50 },
      data: { id: 'end_crm', type: CustomNodeType.END, label: 'End CRM Path', message: 'Lead processed into CRM.' } as EndNodeData,
    },
    {
      id: 'end_email',
      type: CustomNodeType.END,
      position: { x: 1050, y: 250 },
      data: { id: 'end_email', type: CustomNodeType.END, label: 'End Email Path', message: 'Follow-up email scheduled.' } as EndNodeData,
    }
  ];

  const edges: FlowData['edges'] = [
    { id: 'e_trigger_llm', source: 'trigger_lead', target: 'llm_qualify', type: 'smoothstep', markerEnd: {type: MarkerType.ArrowClosed} },
    { id: 'e_llm_condition', source: 'llm_qualify', target: 'condition_isQualified', type: 'smoothstep', markerEnd: {type: MarkerType.ArrowClosed} },
    { id: 'e_condition_crm', source: 'condition_isQualified', sourceHandle: 'output_true', target: 'tool_addToCRM', label: 'Yes', type: 'smoothstep', markerEnd: {type: MarkerType.ArrowClosed} },
    { id: 'e_condition_email', source: 'condition_isQualified', sourceHandle: 'output_false', target: 'tool_sendFollowUp', label: 'No', type: 'smoothstep', markerEnd: {type: MarkerType.ArrowClosed} },
    { id: 'e_crm_end', source: 'tool_addToCRM', target: 'end_crm', type: 'smoothstep', markerEnd: {type: MarkerType.ArrowClosed} },
    { id: 'e_email_end', source: 'tool_sendFollowUp', target: 'end_email', type: 'smoothstep', markerEnd: {type: MarkerType.ArrowClosed} },
  ];

  return {
    name: 'Lead Qualification Agent',
    description: 'Automates lead qualification and initial CRM/email actions.',
    flow: { nodes, edges },
  };
};

export const loadEmailAssistantTemplate = (): PredefinedTemplate => {
  const nodes: FlowData['nodes'] = [
    {
      id: 'trigger_email',
      type: CustomNodeType.TRIGGER,
      position: { x: 50, y: 200 },
      data: {
        id: 'trigger_email',
        type: CustomNodeType.TRIGGER,
        label: 'New Email Received',
        triggerType: 'New Gmail Email',
      } as TriggerNodeData,
    },
    {
      id: 'llm_summarize',
      type: CustomNodeType.LLM_AGENT,
      position: { x: 300, y: 200 },
      data: {
        id: 'llm_summarize',
        type: CustomNodeType.LLM_AGENT,
        label: 'Summarize & Classify',
        prompt: `Summarize the following email and classify its intent (e.g., inquiry, support request, urgent issue, spam). Email Content: {input.body}. Output JSON: {"summary": "email summary", "intent": "classified intent", "isUrgent": boolean, "sender": "{input.from}"}`,
        model: GEMINI_MODEL_NAME,
      } as LLMAgentNodeData,
    },
    {
      id: 'condition_isUrgent',
      type: CustomNodeType.CONDITION,
      position: { x: 550, y: 200 },
      data: {
        id: 'condition_isUrgent',
        type: CustomNodeType.CONDITION,
        label: 'Is Urgent?',
        conditionLogic: 'input.isUrgent === true',
      } as ConditionNodeData,
    },
    {
      id: 'tool_slackAlert',
      type: CustomNodeType.TOOL_ACTION,
      position: { x: 800, y: 100 },
      data: {
        id: 'tool_slackAlert',
        type: CustomNodeType.TOOL_ACTION,
        label: 'Send Slack Alert',
        toolName: 'Send Slack Message',
      } as ToolActionNodeData,
    },
    {
      id: 'tool_labelInbox',
      type: CustomNodeType.TOOL_ACTION,
      position: { x: 800, y: 300 },
      data: {
        id: 'tool_labelInbox',
        type: CustomNodeType.TOOL_ACTION,
        label: 'Label in Inbox',
        toolName: 'Label Gmail Email',
      } as ToolActionNodeData,
    },
    {
      id: 'end_flow_email',
      type: CustomNodeType.END,
      position: { x: 1050, y: 200 },
      data: { id: 'end_flow_email', type: CustomNodeType.END, label: 'End Email Processing', message: 'Email processed.' } as EndNodeData,
    }
  ];

  const edges: FlowData['edges'] = [
    { id: 'e_emailtrigger_llm', source: 'trigger_email', target: 'llm_summarize', type: 'smoothstep', markerEnd: {type: MarkerType.ArrowClosed} },
    { id: 'e_llmsummarize_condition', source: 'llm_summarize', target: 'condition_isUrgent', type: 'smoothstep', markerEnd: {type: MarkerType.ArrowClosed} },
    { id: 'e_conditionurgent_slack', source: 'condition_isUrgent', sourceHandle: 'output_true', target: 'tool_slackAlert', label: 'Yes', type: 'smoothstep', markerEnd: {type: MarkerType.ArrowClosed} },
    { id: 'e_conditionurgent_label', source: 'condition_isUrgent', sourceHandle: 'output_false', target: 'tool_labelInbox', label: 'No', type: 'smoothstep', markerEnd: {type: MarkerType.ArrowClosed} },
    { id: 'e_slack_end', source: 'tool_slackAlert', target: 'end_flow_email', type: 'smoothstep', markerEnd: {type: MarkerType.ArrowClosed} },
    { id: 'e_label_end', source: 'tool_labelInbox', target: 'end_flow_email', type: 'smoothstep', markerEnd: {type: MarkerType.ArrowClosed} },
  ];
  
  return {
    name: 'Email Assistant Agent',
    description: 'Summarizes new emails, classifies intent, and takes actions like Slack alerts or inbox labeling.',
    flow: { nodes, edges },
  };
};
