/**
 * Test script to demonstrate the node discovery system
 */
import { NodePluginManager } from '../manager/NodePluginManager.js';
import { NodeDiscovery } from './NodeDiscovery.js';

async function testNodeDiscovery() {
  console.log('🔍 Testing Node Discovery System...\n');

  // Create plugin manager
  const pluginManager = new NodePluginManager();

  // Create discovery system
  const discovery = new NodeDiscovery(pluginManager, {
    enableBuiltinNodes: true,
    enableCustomNodes: false, // Not implemented yet
  });

  try {
    // Discover and load nodes
    const result = await discovery.discoverAndLoadNodes();

    console.log('📊 Discovery Results:');
    console.log(`✅ Total discovered: ${result.summary.total}`);
    console.log(`✅ Successfully loaded: ${result.summary.successful}`);
    console.log(`❌ Failed to load: ${result.summary.failed}`);
    
    console.log('\n📂 By Category:');
    Object.entries(result.summary.byCategory).forEach(([category, count]) => {
      console.log(`  ${category}: ${count}`);
    });

    console.log('\n📦 By Source:');
    Object.entries(result.summary.bySource).forEach(([source, count]) => {
      console.log(`  ${source}: ${count}`);
    });

    console.log('\n🔌 Discovered Nodes:');
    result.discovered.forEach(node => {
      console.log(`  • ${node.metadata.name} (${node.metadata.type})`);
      console.log(`    Category: ${node.metadata.category}`);
      console.log(`    Version: ${node.metadata.version}`);
      console.log(`    Source: ${node.source}`);
      console.log();
    });

    if (result.errors.length > 0) {
      console.log('❌ Errors:');
      result.errors.forEach(error => {
        console.log(`  • ${error.source}: ${error.error}`);
      });
    }

    // Test plugin manager stats
    console.log('\n📈 Plugin Manager Stats:');
    const stats = pluginManager.getStats();
    console.log(`  Total plugins: ${stats.totalPlugins}`);
    console.log(`  Enabled plugins: ${stats.enabledPlugins}`);
    console.log(`  By category:`, stats.byCategory);

    console.log('\n✅ Node Discovery System Test Completed Successfully!');

  } catch (error) {
    console.error('❌ Node Discovery Test Failed:', error);
  }
}

// Export for use in other modules
export { testNodeDiscovery }; 