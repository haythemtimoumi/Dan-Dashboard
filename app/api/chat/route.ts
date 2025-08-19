import { NextRequest, NextResponse } from 'next/server';
import { getTickerMappings } from '@/app/lib/ticker-mappings';

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Preprocess message to force stock ticker recognition
    let processedMessage = message;
    
    // Common ticker preprocessing
    const tickerReplacements = [
      { pattern: /\bval\b/gi, replacement: 'VAL stock (Valaris Ltd)', exclude: 'valaris' },
      { pattern: /\bhci\b/gi, replacement: 'HCI stock (HCI Group Inc)', exclude: 'group' },
      { pattern: /\bdocs\b/gi, replacement: 'DOCS stock (Doximity Inc)', exclude: 'doximity' },
    ];
    
    for (const { pattern, replacement, exclude } of tickerReplacements) {
      if (pattern.test(message) && !message.toLowerCase().includes(exclude)) {
        processedMessage = processedMessage.replace(pattern, replacement);
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    // Get ticker mappings
    const tickerMappings = await getTickerMappings();
    const tickerCount = tickerMappings.split('\n').length;

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer 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',
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'sonar-reasoning',
        messages: [
          {
            role: 'system',
            content: `You are FIN-ALYTIX, a professional-grade financial analysis engine. Your outputs MUST follow these rules:

**TICKER PROTOCOLS**
- ALWAYS map these tickers:
${tickerMappings}

- When users mention 2-5 letter combinations, ASSUME it's a stock ticker first
- All ${tickerCount} tickers above are in the user's portfolio
- HCI = HCI Group Inc (Insurance company)
- VAL = Valaris Ltd (Offshore drilling)
- NEVER interpret tickers as other topics (HCI ≠ Human-Computer Interaction)

**RESPONSE TEMPLATE**
📌 **{Company} ({Ticker})**  
📍 *Exchange: {NYSE/NASDAQ} | Sector: {Sector}*  
📅 *Data as of: ${new Date().toISOString().split('T')[0]}*

💰 **PRICE DATA** (USD)  
┌──────────────────┬───────────────┐
│ Current Price    │ $XX.XX (X.X%▲)│  
│ 52-Week Range    │ $XX.XX-XX.XX  │  
│ Volume           │ X.XM (XX% avg)│  
│ Market Cap       │ $X.XXB        │  
└──────────────────┴───────────────┘

📊 **CORE METRICS**  
\`\`\`markdown
| Metric          | Value  | vs Sector |
|-----------------|--------|-----------|
| P/E (TTM)       | XX.X   | XX.X      |
| Revenue Growth  | X.X%   | X.X%      |
| Gross Margin    | XX.X%  | XX.X%     |
\`\`\`

🎯 **ANALYSIS**
• Signal Score: (X/10)
• Key Catalyst: {Upcoming Event}
• Immediate Risk: {Top Risk Factor}

⚡ **ACTIONABLE INSIGHTS**
• {Most significant finding}
• {Secondary observation}

**DATA CONSTRAINTS**
If confidence <90%, append:
"⚠️ Low-confidence metric: Verify with primary sources"

Never speculate beyond available data.

Current context: ${context?.currentPage ? `Page: ${context.currentPage}` : ''} ${context?.ticker ? `| Analyzing: ${context.ticker}` : ''}`
          },
          {
            role: 'user',
            content: processedMessage
          }
        ]
      })
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Remove <think> tags and today's date line
    let content = data.choices[0].message.content;
    content = content.replace(/<think>.*?<\/think>/gs, '').trim();
    content = content.replace(/\*?(Today's date|Current date): [0-9-]+\*?/gi, '').trim();
    
    // Add sources section if search results exist
    if (data.search_results && data.search_results.length > 0) {
      content += '\n\n---\n\n### 📚 Sources\n\n';
      data.search_results.slice(0, 5).forEach((source: any, index: number) => {
        if (source.title && source.url) {
          content += `${index + 1}. [${source.title}](${source.url})\n`;
        }
      });
    }
    
    return NextResponse.json({
      content: content
    });

  } catch (error: any) {
    console.error('Chat API error:', error);
    
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout. Please try a shorter question.' },
        { status: 408 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}