/**
 * Test script to verify that the UI variable refresh system works correctly
 * This simulates the exact scenario the user is experiencing
 */

import { applicationCore } from './packages/core/src/ApplicationCore';
import { useFlowStore } from './store/flowStore';

function testVariableRefreshSystem() {
  console.log('🧪 Testing Variable Refresh System...\n');

  // 1. Create a mock flow with HTTP Request -> LLM Agent
  const mockFlow = {
    nodes: [
      {
        id: 'http-node-001',
        type: 'httpRequestNode',
        data: { label: 'API Call' },
        position: { x: 0, y: 0 }
      },
      {
        id: 'llm-node-002',
        type: 'llmAgentNode',
        data: { label: 'Process Data' },
        position: { x: 200, y: 0 }
      }
    ],
    edges: [
      {
        id: 'edge-1',
        source: 'http-node-001',
        target: 'llm-node-002'
      }
    ],
    viewport: { x: 0, y: 0, zoom: 1 }
  };

  // 2. Load the flow into the store
  const store = useFlowStore.getState();
  store.loadFlow(mockFlow);

  // 3. Check initial variables for LLM node (should be only static)
  console.log('📊 Initial variables for LLM node:');
  const initialVars = store.getAvailableVariablesForNode('llm-node-002');
  console.log(`Found ${initialVars.length} variables:`);
  initialVars.forEach(v => {
    console.log(`  • ${v.fullPath} (${v.variableType}) ${v.isNested ? '[Runtime]' : '[Static]'}`);
  });

  // 4. Simulate HTTP node execution with complex response
  console.log('\n🚀 Simulating HTTP node execution...');
  const mockHttpResponse = {
    httpResponse: {
      status: 200,
      statusText: 'OK',
      headers: {
        'content-type': 'application/json',
        'x-rate-limit': '100'
      },
      data: {
        user: {
          id: 123,
          name: 'Jane Smith',
          email: 'jane@example.com',
          profile: {
            age: 28,
            skills: ['JavaScript', 'Python', 'React'],
            preferences: {
              theme: 'dark',
              notifications: true
            }
          }
        },
        products: [
          { id: 1, name: 'Laptop', price: 999.99 },
          { id: 2, name: 'Mouse', price: 29.99 }
        ]
      }
    },
    responseData: {
      success: true,
      message: 'Data fetched successfully',
      timestamp: Date.now()
    },
    responseStatus: 200
  };

  // 5. Register runtime variables (simulating setNodeOutput call)
  console.log('📝 Registering runtime variables...');
  applicationCore.variableRegistry.registerRuntimeVariables('http-node-001', mockHttpResponse);

  // 6. Small delay to allow event processing
  setTimeout(() => {
    // 7. Check variables again after runtime registration
    console.log('\n📊 Variables after runtime registration:');
    const updatedVars = store.getAvailableVariablesForNode('llm-node-002');
    console.log(`Found ${updatedVars.length} variables:`);
    
    const staticVars = updatedVars.filter(v => !v.isNested);
    const runtimeVars = updatedVars.filter(v => v.isNested);
    
    console.log(`\n🔹 Static Variables (${staticVars.length}):`);
    staticVars.forEach(v => {
      console.log(`  • ${v.fullPath} (${v.variableType})`);
    });
    
    console.log(`\n🔸 Runtime Variables (${runtimeVars.length}):`);
    runtimeVars.forEach(v => {
      console.log(`  • ${v.fullPath} (${v.variableType}) - ${JSON.stringify(v.example)}`);
    });

    // 8. Test specific nested variables the user mentioned
    console.log('\n🎯 Testing specific variables mentioned by user:');
    const testPaths = [
      'http-node-001.httpResponse.data.user.name',
      'http-node-001.responseData.data.price', // This won't exist in our mock, but let's check
      'http-node-001.httpResponse.status',
      'http-node-001.httpResponse.data.products[0].price'
    ];

    testPaths.forEach(path => {
      const found = updatedVars.find(v => v.fullPath === path);
      if (found) {
        console.log(`  ✅ ${path} → ${JSON.stringify(found.example)} (${found.variableType})`);
      } else {
        console.log(`  ❌ ${path} → Not found`);
      }
    });

    // 9. Summary
    console.log('\n📈 Summary:');
    console.log(`  • Initial variables: ${initialVars.length}`);
    console.log(`  • Final variables: ${updatedVars.length}`);
    console.log(`  • Runtime variables added: ${runtimeVars.length}`);
    
    if (runtimeVars.length > 0) {
      console.log('\n✅ SUCCESS: Runtime variables are being extracted and shown in UI!');
      console.log('Users should now see nested variables like:');
      runtimeVars.slice(0, 5).forEach(v => {
        console.log(`   • {${v.fullPath}}`);
      });
    } else {
      console.log('\n❌ FAILURE: Runtime variables are not being registered or displayed');
    }

  }, 100); // Small delay for event processing
}

// Run the test
console.log('🔍 Testing Variable Refresh System...');
testVariableRefreshSystem(); 