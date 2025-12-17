// api/chat.js
// 这是一个运行在 Node.js 环境的 Serverless Function

export default async function handler(req, res) {
  // 1. 安全检查：只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, modelType, password } = req.body;

  // 2. 简易鉴权：防止陌生人刷爆你的卡
  // 你需要在环境变量里设置一个 PASSWORD
  if (password !== process.env.ACCESS_PASSWORD) {
    return res.status(401).json({ error: '密码错误，别白嫖我！' });
  }

  let apiUrl = '';
  let apiKey = '';
  let modelName = '';

  // 3. 根据前端选的模型，切换不同的 Key 和 API 地址
  switch (modelType) {
    case 'deepseek':
      apiUrl = 'https://api.deepseek.com/chat/completions';
      apiKey = process.env.DEEPSEEK_API_KEY;
      modelName = 'deepseek-chat';
      break;
    case 'gemini':
      // Gemini 也可以用 OpenAI 兼容模式，或者用原生 REST API
      // 这里为了演示简单，假设我们用 OpenAI 兼容库或只需改 URL
      apiUrl = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
      apiKey = process.env.GEMINI_API_KEY;
      modelName = 'gemini-1.5-flash';
      break;
    case 'chatgpt':
      apiUrl = 'https://api.openai.com/v1/chat/completions';
      apiKey = process.env.OPENAI_API_KEY;
      modelName = 'gpt-4o-mini';
      break;
    default:
      return res.status(400).json({ error: '未知模型' });
  }

  try {
    // 4. 作为中转站，向官方发起请求
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: "user", content: message }] // 简化版，不带历史记录
      })
    });

    const data = await response.json();
    
    // 5. 把官方的回复返回给前端
    if (data.choices && data.choices.length > 0) {
      return res.status(200).json({ reply: data.choices[0].message.content });
    } else {
      return res.status(500).json({ error: JSON.stringify(data) });
    }

  } catch (error) {
    return res.status(500).json({ error: '服务器炸了: ' + error.message });
  }
}
