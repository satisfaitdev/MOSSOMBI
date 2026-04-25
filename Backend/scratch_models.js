import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({ path: '../Backend/.env' });

const key = process.env.GEMINI_API_KEY;

async function checkModels() {
  try {
    const res = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const models = res.data.models;
    const targets = models.filter(m => m.name.toLowerCase().includes('image') || m.name.toLowerCase().includes('generate'));
    console.log(JSON.stringify(targets.map(m => ({
        name: m.name,
        methods: m.supportedGenerationMethods
    })), null, 2));
  } catch (e) {
    console.error(e?.response?.data || e.message);
  }
}

checkModels();
