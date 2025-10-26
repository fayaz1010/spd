const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkKeys() {
  try {
    const settings = await prisma.apiSettings.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('\n=== API Settings in Database ===\n');
    
    if (settings.length === 0) {
      console.log('❌ No API settings found in database');
      return;
    }
    
    settings.forEach((setting, index) => {
      console.log(`\n--- Setting ${index + 1} (ID: ${setting.id}) ---`);
      console.log(`Active: ${setting.active}`);
      console.log(`Created: ${setting.createdAt}`);
      
      // Check Gemini keys
      if (setting.geminiApiKey) {
        try {
          const keys = JSON.parse(setting.geminiApiKey);
          console.log(`\n🔑 Gemini API Keys: ${Array.isArray(keys) ? keys.length : 1} key(s)`);
          
          if (Array.isArray(keys)) {
            keys.forEach((key, i) => {
              // Decrypt and show first/last 4 chars
              const decrypted = Buffer.from(key, 'base64').toString('utf-8');
              const masked = `${decrypted.substring(0, 8)}...${decrypted.substring(decrypted.length - 4)}`;
              console.log(`  Key ${i + 1}: ${masked}`);
            });
          } else {
            const decrypted = Buffer.from(setting.geminiApiKey, 'base64').toString('utf-8');
            const masked = `${decrypted.substring(0, 8)}...${decrypted.substring(decrypted.length - 4)}`;
            console.log(`  Key: ${masked}`);
          }
        } catch (e) {
          console.log(`❌ Error parsing Gemini keys: ${e.message}`);
        }
      } else {
        console.log('❌ No Gemini API keys found');
      }
      
      console.log(`\nGemini Model: ${setting.geminiModel || 'Not set'}`);
      console.log(`Gemini Enabled: ${setting.geminiEnabled}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkKeys();
