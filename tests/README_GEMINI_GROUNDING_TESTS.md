# Gemini Grounding & Search Capability Tests 🔍

## 📋 Overview

This test suite validates whether Google's Gemini API can:
- ✅ Search for current/timely information
- ✅ Ground responses with real data
- ✅ Provide citations and sources
- ✅ Use up-to-date information (2025 vs 2024)

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd d:\SPD\webapp\nextjs_space
npm install @google/generative-ai
```

### 2. Set API Key
```bash
# Windows PowerShell
$env:GEMINI_API_KEY="your-api-key-here"

# Or add to .env file
GEMINI_API_KEY=your-api-key-here
```

### 3. Run Tests
```bash
node tests/test_gemini_grounding_search.js
```

## 🧪 Test Cases

### Test 1: Basic Response (No Grounding)
**Purpose:** Baseline test without any grounding features  
**Checks:**
- Does it mention 2025?
- Does it mention 2024 (outdated)?
- Does it include citations?

### Test 2: With Google Search Grounding
**Purpose:** Test Google Search integration  
**Checks:**
- Is grounding metadata returned?
- Are sources/URLs provided?
- Is information current?

**Note:** This feature may require:
- Gemini Advanced API tier
- Specific region availability
- Additional API permissions

### Test 3: Explicit Date Constraint
**Purpose:** Force current data through prompting  
**Checks:**
- Does it respect date constraints?
- Does it provide disclaimers?
- Does it avoid outdated data?

### Test 4: Perth-Specific Solar Data
**Purpose:** Test accuracy of local data  
**Checks:**
- Feed-in tariff rates
- Electricity prices
- STC values
- Date accuracy

### Test 5: Citation Request
**Purpose:** Test citation formatting  
**Checks:**
- Bracket citations [Source, Year]
- Source mentions
- Attribution quality

### Test 6: Real-Time Data Request
**Purpose:** Test current date awareness  
**Checks:**
- Current year mentions
- Date context
- Timeliness disclaimers

## 📊 Expected Output

```
================================================================================
TEST 1: Basic Gemini Response (No Grounding)
================================================================================

Prompt:
What are the current solar rebates and incentives available in Perth...

Response:
[Generated content here]

📊 Analysis:
✓ Mentions 2025: ✅ YES
✓ Mentions 2024: ❌ NO
✓ Has Citations: ❌ NO

================================================================================
TEST 2: Gemini with Google Search Grounding
================================================================================

[... and so on for each test]
```

## 🎯 Interpreting Results

### ✅ Grounding Available
If Test 2 shows grounding metadata:
```json
{
  "groundingChunks": [
    {
      "web": {
        "uri": "https://...",
        "title": "..."
      }
    }
  ]
}
```

**Action:** Enable grounding for all article generation!

### ❌ Grounding Not Available
If Test 2 fails with error:

**Possible Reasons:**
1. API tier doesn't support grounding
2. Region restrictions
3. Feature not enabled

**Alternative Solutions:**
1. Use explicit date constraints
2. Request citations in prompts
3. Manual verification workflow
4. External web scraping

## 💡 Recommendations Based on Results

### Scenario A: Grounding Works ✅
```typescript
// Enable grounding in article generation
const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash-exp',
  tools: [{
    googleSearchRetrieval: {
      dynamicRetrievalConfig: {
        mode: 'MODE_DYNAMIC',
        dynamicThreshold: 0.7,
      }
    }
  }]
});

// Extract sources from response
const groundingMetadata = result.response.candidates[0].groundingMetadata;
const sources = groundingMetadata.groundingChunks.map(chunk => ({
  title: chunk.web.title,
  url: chunk.web.uri,
}));

// Add to article
article.sources = sources;
```

### Scenario B: Grounding Doesn't Work ❌
```typescript
// Use explicit prompting strategy
const prompt = `
IMPORTANT INSTRUCTIONS:
- Today's date is ${new Date().toLocaleDateString('en-AU')}
- Only use information from 2025
- Cite all sources with [Source Name, 2025] format
- If you don't have current data, state the date of your information

Topic: ${articleTopic}

Write a comprehensive article...
`;

// Manual verification step
const verificationPrompt = `
Review this article and identify any outdated information:
${generatedArticle}

List any references to 2024 or earlier that should be updated.
`;
```

## 🔧 Integration with Article Generation

### Update Workflow

**Current:**
```typescript
const blogData = await generateBlogPostWorkflow({
  topic: pillar.title,
  keywords: [pillar.targetKeyword],
  targetLength: 3000,
});
```

**Enhanced with Grounding:**
```typescript
const blogData = await generateBlogPostWorkflow({
  topic: pillar.title,
  keywords: [pillar.targetKeyword],
  targetLength: 3000,
  useGrounding: true,  // NEW!
  requireCitations: true,  // NEW!
  currentDate: new Date().toISOString(),  // NEW!
});

// Extract grounding metadata
if (blogData.groundingMetadata) {
  await prisma.blogPost.update({
    where: { id: blogPost.id },
    data: {
      sources: blogData.groundingMetadata.groundingChunks,
      lastVerified: new Date(),
    },
  });
}
```

## 📝 Prompt Templates

### Template 1: With Date Context
```typescript
const prompt = `
CONTEXT:
- Current Date: ${new Date().toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' })}
- Location: Perth, Western Australia
- Target Audience: Perth homeowners

REQUIREMENTS:
- Use only current 2025 information
- Cite all statistics and claims
- Include specific dollar amounts where relevant
- Reference official government sources

TOPIC: ${topic}

Write a comprehensive article...
`;
```

### Template 2: With Citation Requirements
```typescript
const prompt = `
Write an article about: ${topic}

CITATION REQUIREMENTS:
1. Format: [Source Name, Date]
2. Include at least 3 citations
3. Prefer government and official sources
4. Include URLs where possible

Example: "The average solar system costs $X [Clean Energy Regulator, 2025]"

Article content:
`;
```

### Template 3: With Verification
```typescript
// Step 1: Generate
const article = await generateArticle(topic);

// Step 2: Verify timeliness
const verificationPrompt = `
Review this article for outdated information:

${article}

Tasks:
1. Identify any references to 2024 or earlier
2. Check if prices/rates are current
3. Verify government program names are current
4. List any information that needs updating

Format response as JSON:
{
  "outdatedReferences": ["..."],
  "needsUpdate": ["..."],
  "isTimely": true/false
}
`;

const verification = await verifyArticle(verificationPrompt);

// Step 3: Update if needed
if (!verification.isTimely) {
  const updatePrompt = `
  Update this article to use only 2025 information:
  
  ${article}
  
  Outdated items to fix:
  ${verification.outdatedReferences.join('\n')}
  `;
  
  article = await updateArticle(updatePrompt);
}
```

## 🎯 Success Criteria

An article passes timeliness checks if:
- ✅ Mentions current year (2025)
- ✅ No references to 2024 or earlier (unless historical context)
- ✅ Includes citations with dates
- ✅ Uses current prices/rates
- ✅ References active government programs

## 🚨 Common Issues

### Issue 1: Outdated Data
**Symptom:** Articles reference 2024 information  
**Solution:** Add explicit date constraints to prompts

### Issue 2: No Citations
**Symptom:** No sources provided  
**Solution:** Explicitly request citations in prompt

### Issue 3: Generic Information
**Symptom:** Not Perth-specific  
**Solution:** Add location context to every prompt

### Issue 4: Grounding Not Working
**Symptom:** No grounding metadata returned  
**Solution:** Check API tier, try alternative prompting

## 📈 Metrics to Track

```typescript
interface ArticleQualityMetrics {
  hasCurrentYear: boolean;      // Mentions 2025
  hasOutdatedYear: boolean;     // Mentions 2024
  citationCount: number;        // Number of citations
  sourceCount: number;          // Number of unique sources
  groundingUsed: boolean;       // Grounding metadata present
  perthSpecific: boolean;       // Perth context included
  priceReferences: number;      // Specific dollar amounts
  governmentSources: number;    // Official source citations
}
```

## 🔄 Next Steps

1. **Run the test script**
2. **Review results**
3. **Determine grounding availability**
4. **Choose implementation strategy**
5. **Update article generation workflow**
6. **Add verification step**
7. **Monitor article quality**

## 📞 Support

If grounding is not available:
- Check Gemini API documentation
- Verify API tier supports grounding
- Contact Google Cloud support
- Implement alternative verification workflow

---

**Last Updated:** October 25, 2025  
**Test Version:** 1.0  
**Gemini Model:** gemini-2.0-flash-exp
