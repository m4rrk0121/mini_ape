// server.js - Express server to proxy OpenAI requests
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

const corsOptions = {
  origin: [
    'https://www.kingofapes.fun/',
    'https://frontendv2-mxw8.onrender.com',
    'http://localhost:4003'  // For local development
  ],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'X-API-Key', 'Origin'],
  credentials: true
};

app.use(cors(corsOptions));

app.use(express.json());

// Initialize OpenAI with your API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// KOA platform knowledge context
const KOA_KNOWLEDGE = `
KOA (King of Apes) Information:
- Platform: KOA is a platform for exploring, trading, and deploying tokens on the Base network with a jungle theme
- Token Operations: Users can buy, sell, and deploy tokens through the platform
- Charts and analytics: Users can view charts and analytics for any token on the platform via token page
- Fees: Trading uses 1% fee tier 50-50 split between creator and platform; token deployment costs >0.005 ETH
- Token Management: Coming soon - Users can update token images, manage liq uidity, view analytics
- Base Network: KOA operates on Base, an Ethereum L2 with low fees and fast confirmations
- Security: Deployed tokens are verified and cannot be changed, security scores are some of the very best on the market
- Support: Available via telegram
- Community: Programs include ambassador roles, bug bounties
- KOA platform is run by an experienced team of trench degens, with a focus on creating a fun and engaging experience for users

Common User Needs:
1. Buying tokens: Connect wallet, enter ETH amount, review, click Buy
2. Selling tokens: Navigate to token page, connect wallet, switch to Sell, enter amount, review, confirm
3. Deploying tokens: Go to Deploy Token page, fill details, pay fee, follow deployment steps
4. Updating token images: Go to Update Token Info, connect wallet that deployed the token, upload image or provide URL
5. Understanding fees: Trading (1%), deployment (0.01-0.05 ETH), updates (0.005 ETH)
`;

// Middleware to check for API key
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || apiKey !== process.env.CLIENT_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
};

// OpenAI proxy endpoint
app.post('/api/chat', validateApiKey, async (req, res) => {
  try {
    const { messages, userInput } = req.body;
    
    if (!userInput) {
      return res.status(400).json({ error: 'User input is required' });
    }
    
    // Create conversation context from message history
    const conversationContext = messages
      .filter(msg => msg.id !== messages[messages.length - 1].id) // Exclude the latest user message
      .map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      }));
    
    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: req.body.model || "gpt-3.5-turbo", // Allow model selection with default
      messages: [
        {
          role: "system",
          content: `You are Mini Ape Advice, a sarcastic, somewhat edgy, and definitely not politically correct assistant for the KOA (King of Apes) platform.
          
          Your personality:
          - You're a bit of a smartass but ultimately helpful
          - You use casual language, slang, and the occasional mild profanity
          - You're brutally honest and don't sugarcoat things
          - You make jokes at the expense of both the platform and the users (but nothing truly offensive)
          - You occasionally poke fun at crypto culture stereotypes
          - You're sarcastic but never mean-spirited
          
          Your purpose:
          - Help users navigate the KOA platform with a sense of humor
          - Explain token trading, deployment, and features in a way that doesn't put people to sleep
          - Never provide investment advice or price predictions (and mock anyone who asks for them)
          - If you don't know something specific about KOA, admit it honestly with a self-deprecating joke
          - Never make up features that don't exist (and point out that would be stupid)
          
          Remember: Be funny and sarcastic, but still actually helpful. Users should leave the conversation both entertained AND with their questions answered.
          
          ${KOA_KNOWLEDGE}`
        },
        ...conversationContext,
        { role: "user", content: userInput }
      ],
      temperature: req.body.temperature || 0.7,
      max_tokens: req.body.max_tokens || 300
    });
    
    // Send the response back to the client
    res.json({
      response: completion.choices[0].message.content,
      usage: completion.usage
    });
    
  } catch (error) {
    console.error('Error calling OpenAI:', error);
  
    res.status(500).json({
      error: 'Failed to get AI response',
      message: error.message
    });
  }
});

// Usage stats endpoint
app.get('/api/usage', validateApiKey, (req, res) => {
  // In a production app, you'd track API usage in a database
  // This is a placeholder for demonstration
  res.json({
    dailyRequests: 120,
    monthlyRequests: 1450,
    tokenUsage: 356000,
    estimatedCost: '$7.12'
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
