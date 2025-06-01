import { NestedVariableExtractor, DynamicVariableDefinition } from './NestedVariableExtractor';

/**
 * Test file for NestedVariableExtractor
 * Run with: npm test or just execute this file to see console output
 */

function runTests() {
  console.log('🧪 Testing NestedVariableExtractor...\n');

  const extractor = new NestedVariableExtractor();

  // Test 1: Simple object flattening
  console.log('📦 Test 1: Simple Object Flattening');
  const simpleObject = {
    user: {
      name: 'John Doe',
      age: 30,
      email: 'john@example.com'
    },
    status: 'active'
  };

  const simpleVars = extractor.extractVariables(simpleObject, 'node-123', 'responseData');
  console.log(`Extracted ${simpleVars.length} variables:`);
  simpleVars.forEach(v => console.log(`  • ${v.fullPath} (${v.type}): ${JSON.stringify(v.example)}`));
  console.log('');

  // Test 2: Array handling
  console.log('📋 Test 2: Array Handling');
  const arrayObject = {
    items: ['React', 'TypeScript', 'Node.js'],
    users: [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' }
    ]
  };

  const arrayVars = extractor.extractVariables(arrayObject, 'node-456', 'responseData');
  console.log(`Extracted ${arrayVars.length} variables:`);
  arrayVars.forEach(v => console.log(`  • ${v.fullPath} (${v.type}): ${JSON.stringify(v.example)}`));
  console.log('');

  // Test 3: Special keys (bracket notation)
  console.log('🔧 Test 3: Special Keys (Bracket Notation)');
  const specialKeysObject = {
    "Hard disk size": "1TB",
    "user-id": 12345,
    "api_key": "secret123",
    "normal_key": "value"
  };

  const specialVars = extractor.extractVariables(specialKeysObject, 'node-789', 'responseData');
  console.log(`Extracted ${specialVars.length} variables:`);
  specialVars.forEach(v => console.log(`  • ${v.fullPath} (${v.type}): ${JSON.stringify(v.example)}`));
  console.log('');

  // Test 4: Real HTTP response simulation
  console.log('🌐 Test 4: Real HTTP Response Simulation');
  const httpResponse = {
    httpResponse: {
      status: 200,
      statusText: 'OK',
      headers: {
        'content-type': 'application/json',
        'x-rate-limit': '100'
      },
      data: {
        id: 123,
        user: {
          name: 'Jane Smith',
          profile: {
            age: 28,
            skills: ['JavaScript', 'Python', 'React'],
            metadata: {
              lastLogin: '2024-01-01T12:00:00Z',
              preferences: {
                theme: 'dark',
                notifications: true
              }
            }
          }
        },
        results: [
          { id: 1, score: 95.5, tags: ['important', 'urgent'] },
          { id: 2, score: 87.2, tags: ['normal'] }
        ]
      },
      responseTime: 150,
      success: true
    },
    responseData: {
      id: 123,
      user: {
        name: 'Jane Smith',
        profile: {
          age: 28,
          skills: ['JavaScript', 'Python', 'React']
        }
      }
    },
    responseStatus: 200
  };

  const httpVars = extractor.extractVariables(httpResponse, 'http-node-001');
  console.log(`Extracted ${httpVars.length} variables from HTTP response:`);
  
  // Group by depth for better readability
  const byDepth = httpVars.reduce((acc, v) => {
    acc[v.depth] = acc[v.depth] || [];
    acc[v.depth].push(v);
    return acc;
  }, {} as Record<number, DynamicVariableDefinition[]>);

  Object.keys(byDepth).sort().forEach(depth => {
    console.log(`  Depth ${depth}:`);
    byDepth[parseInt(depth)].forEach(v => {
      console.log(`    • ${v.fullPath} (${v.type}): ${JSON.stringify(v.example)}`);
    });
  });
  console.log('');

  // Test 5: Performance test with large object
  console.log('⚡ Test 5: Performance Test');
  const largeObject = {
    data: Array.from({ length: 20 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
      properties: {
        value: Math.random() * 100,
        category: `Category ${i % 5}`,
        metadata: {
          created: new Date().toISOString(),
          tags: [`tag${i}`, `tag${i + 1}`]
        }
      }
    }))
  };

  const start = performance.now();
  const largeVars = extractor.extractVariables(largeObject, 'node-large', 'data');
  const end = performance.now();
  
  console.log(`Extracted ${largeVars.length} variables in ${(end - start).toFixed(2)}ms`);
  console.log(`Stats:`, extractor.getStats());
  console.log('');

  // Test 6: Edge cases
  console.log('🚨 Test 6: Edge Cases');
  const edgeCases = {
    nullValue: null,
    undefinedValue: undefined,
    emptyString: '',
    emptyArray: [],
    emptyObject: {},
    nestedEmpty: {
      level1: {
        level2: {
          level3: {
            empty: {}
          }
        }
      }
    }
  };

  const edgeVars = extractor.extractVariables(edgeCases, 'node-edge', 'data');
  console.log(`Extracted ${edgeVars.length} variables from edge cases:`);
  edgeVars.forEach(v => console.log(`  • ${v.fullPath} (${v.type}): ${JSON.stringify(v.example)}`));

  console.log('\n✅ All tests completed!');
}

// Run the tests
if (typeof window === 'undefined') {
  // Node.js environment
  runTests();
} else {
  // Browser environment
  console.log('Run this in Node.js environment to see the test results');
}

export { runTests }; 