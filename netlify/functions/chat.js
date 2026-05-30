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
 
    const systemPrompt = `You are a sharp, friendly sales assistant for Dallas Venetian Co. Be concise and helpful. Never cut off mid-sentence. Always complete your answer in 1-2 short sentences max.
 
Facts:
- Phone: 214-435-2651
- Location: Dallas TX, serving all DFW
- Services: Venetian Plaster Classic, Marmorino, Custom Textures
- Pricing: $8-$15 per sq ft for most residential rooms
- Free on-site consultations
- 15+ years experience, Italian-trained artisans
 
Rules:
- Keep answers SHORT and COMPLETE - never cut off
- Be direct, warm, and professional
- Always end with a call to action (call us or fill the form)
- Respond in the same language the user writes in`;
 
    const messages = [];
    if (history && history.length > 0) {
      history.slice(-6).forEach(msg => {
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
          generationConfig: { maxOutputTokens: 300, temperature: 0.5 }
        })
      }
    );
 
    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Great question! Call us at 214-435-2651 and we will be happy to help.";
 
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
      body: JSON.stringify({ reply: "Thanks for reaching out! Call us at 214-435-2651 for immediate assistance." })
    };
  }
};
