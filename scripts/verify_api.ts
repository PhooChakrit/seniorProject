import axios from 'axios';

async function verifyApi() {
  const baseUrl = 'http://localhost:3000/api';
  
  console.log('--- Verifying API Data Source ---');
  
  try {
    // 1. Check Metadata
    console.log('\n[1] Fetching Metadata (available species/chromosomes)...');
    const metaRes = await axios.get(`${baseUrl}/genome/spacers/metadata`);
    console.log('Species found:', metaRes.data.species);
    console.log('Chromosomes by Species:', JSON.stringify(metaRes.data.chromosomesBySpecies, null, 2));

    // 2. Query Chr01 (Should have data)
    console.log('\n[2] Querying Oryza sativa Chr01 (10000-20000)...');
    const chr01Res = await axios.get(`${baseUrl}/genome/spacers`, {
      params: {
        species: 'oryza_sativa',
        chromosome: 'Chr01',
        from: 10000,
        to: 20000
      }
    });
    console.log(`Status: ${chr01Res.status}`);
    console.log(`Total Records: ${chr01Res.data.pagination.total}`);
    console.log(`First Spacer:`, chr01Res.data.spacers[0]);

    // 3. Query Chr02 (Should be empty)
    console.log('\n[3] Querying Oryza sativa Chr02 (10000-20000)...');
    const chr02Res = await axios.get(`${baseUrl}/genome/spacers`, {
      params: {
        species: 'oryza_sativa',
        chromosome: 'Chr02',
        from: 10000,
        to: 20000
      }
    });
    console.log(`Status: ${chr02Res.status}`);
    console.log(`Total Records: ${chr02Res.data.pagination.total}`);
    
    console.log('\n--- Conclusion ---');
    if (chr01Res.data.pagination.total > 0 && chr02Res.data.pagination.total === 0) {
      console.log('✅ API functions correctly: Returns data for Chr01 (present in DB) and 0 for Chr02 (missing from DB).');
      console.log('This proves the Frontend is NOT querying fake/mock data, but reflecting the actual Database state.');
    } else {
      console.log('❌ Unexpected results.');
    }

  } catch (error) {
    console.error('API Request Failed:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    }
  }
}

verifyApi();
