// api/chat.js
export default async function handler(req, res) {
  // 1. 安全检查：只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 解构请求体（去掉了 password）
  const { message, modelType } = req.body;

  // --- 原来的第2步（密码验证）已被删除，现在大门敞开 ---

  let apiUrl = '';
  let apiKey = '';
  let modelName = '';

  // 3. 根据前端选的模型，切换不同的 Key 和 API 地址
  // 注意：这里读取的 process.env.XXX 必须在 Vercel 后台设置！
  switch (modelType) {
    case 'deepseek':
      apiUrl = 'https://api.deepseek.com/chat/completions';
      apiKey = process.env.DEEPSEEK_API_KEY; // 对应 Vercel 变量名
      modelName = 'deepseek-chat';
      break;
    case 'gemini':
      apiUrl = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
      apiKey = process.env.GEMINI_API_KEY;   // 对应 Vercel 变量名
      modelName = 'gemini-1.5-flash';
      break;
    case 'chatgpt':
      apiUrl = 'https://api.openai.com/v1/chat/completions';
      apiKey = process.env.OPENAI_API_KEY;   // 对应 Vercel 变量名
      modelName = 'gpt-4o-mini';
      break;
    default:
      // 如果前端没传 modelType，默认给一个（防止报错）
      apiUrl = 'https://api.deepseek.com/chat/completions';
      apiKey = process.env.DEEPSEEK_API_KEY;
      modelName = 'deepseek-chat';
  }

  // 检查一下是否有 Key，如果没有，提前报错，方便调试
  if (!apiKey) {
    return res.status(500).json({ error: `服务器端未配置 ${modelType} 的 API Key` });
  }

  try {
    // 4. 向官方发起请求
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: "user", content: message }]
      })
    });

    const data = await response.json();
    
    // 5. 返回结果
    if (data.choices && data.choices.length > 0) {
      return res.status(200).json({ reply: data.choices[0].message.content });
    } else {
      // 这里的 JSON.stringify(data) 能让你看到官方具体的报错原因
      return res.status(500).json({ error: JSON.stringify(data) });
    }

  } catch (error) {
    return res.status(500).json({ error: '服务器炸了: ' + error.message });
  }
}
