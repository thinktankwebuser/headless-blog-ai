const { portfolioSections } = require('../lib/portfolio-content.ts');

// Simple seeding script using the RAG API
async function seedSupabase() {
  try {
    console.log('🌱 Starting Supabase seeding...');
    console.log(`📄 Found ${portfolioSections.length} portfolio sections to seed`);

    const response = await fetch('http://localhost:3001/api/rag', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-portfolio-secret': process.env.PORTFOLIO_SECRET || 'austin-portfolio-demo-secret-key-2024'
      },
      body: JSON.stringify({
        action: 'seed',
        items: portfolioSections
      })
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Seeding completed successfully!');
      console.log(`📊 Processed: ${result.processed} sections`);
      console.log(`✅ Successful: ${result.successful} sections`);
      if (result.failed > 0) {
        console.log(`❌ Failed: ${result.failed} sections`);
        console.log('Errors:', result.errors);
      }
    } else {
      console.error('❌ Seeding failed:', result);
    }

  } catch (error) {
    console.error('❌ Error during seeding:', error.message);
  }
}

// Check if data already exists first
async function checkExistingData() {
  try {
    const response = await fetch('http://localhost:3001/api/rag', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-portfolio-secret': process.env.PORTFOLIO_SECRET || 'austin-portfolio-demo-secret-key-2024'
      },
      body: JSON.stringify({ action: 'list' })
    });

    const result = await response.json();

    if (response.ok) {
      console.log(`📋 Current database has ${result.count} documents`);
      return result.count;
    } else {
      console.log('📋 Could not check existing data:', result.error);
      return 0;
    }
  } catch (error) {
    console.log('📋 Could not check existing data:', error.message);
    return 0;
  }
}

// Main execution
(async () => {
  console.log('🚀 Portfolio Supabase Seeder');
  console.log('===============================');

  const existingCount = await checkExistingData();

  if (existingCount > 0) {
    console.log('⚠️  Database already contains data. Seeding will upsert (update/insert) documents.');
  }

  await seedSupabase();
})();