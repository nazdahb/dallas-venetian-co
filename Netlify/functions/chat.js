const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    const { message, history } = JSON.parse(event.body);
    const apiKey = process.env.GEMINI_API_KEY;

    const systemPrompt = `You are a helpful assistant for Dallas Venetian Co., a luxury venetian plaster company based in Dallas, TX. 

Business Info:
- Name: Dallas Venetian Co.
- Phone: 214-435-2651
- Location: Dallas, TX — serving all of DFW (Highland Park, Uptown, Frisco, Plano, Southlake, McKinney)
- Services: Venetian Plaster Classic, Marmorino, Custom Textures & Finishes
- Pricing: Most residential rooms start around $8-$15 per sq ft
- Free on-site consultations available
- 15+ years experience, Italian-trained artisans, premium European materials
- Residential and commercial projects

Your job:
- Answer questions about services, pricing, process, and service area
- Always be warm, professional, and elegant — matching the luxury brand
- Encourage visitors to call 214-435-2651 or fill out the contact form
- Keep responses concise — 2-3 sentences max
- If asked something you don't know, direct them to call
- Never make up information not listed above
- Respond in the same language the user writes in (English or Spanish)`;

    const messages = [];
    if (history && history.length > 0) {
      history.forEach(msg => {
        messages.push({
          role: msg.role === 'bot' ? 'model' : 'user',
          parts: [{ text: msg.text }]
        });
      });
    }
    messages.push({ role: 'user', parts: [{ text: message }] });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: messages,
          generationConfig: { maxOutputTokens: 150, temperature: 0.7 }
        })
      }
    );

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'd be happy to help! Please call us at 214-435-2651 for immediate assistance.";

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ reply })
    };
  } catch (error) {
    console.error('Chat error:', error);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ reply: "Thanks for reaching out! For fastest assistance, please call us at 214-435-2651." })
    };
  }
};
