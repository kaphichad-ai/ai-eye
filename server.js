const express = require('express');
const cors = require('cors');
const path = require('path'); // เพิ่ม path module เข้ามา
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// ตั้งค่ารับส่งข้อมูลแบบ JSON และรองรับขนาดภาพใหญ่
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// [เพิ่มส่วนนี้] กำหนดให้ Express เสิร์ฟไฟล์หน้าเว็บ (HTML, CSS, JS) จากโฟลเดอร์ปัจจุบัน
app.use(express.static(path.join(__dirname)));

// กำหนดค่า Google Gen AI SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// API Endpoint สำหรับรับภาพจากหน้าเว็บไปให้ Gemini ทาย
app.post('/api/guess', async (req, res) => {
    try {
        const { image, targetWord } = req.body;
        if (!image) {
            return res.status(400).json({ error: 'ไม่พบข้อมูลรูปภาพ' });
        }

        // ตัด Header ของ Base64 ออก (เช่น "data:image/png;base64,")
        const base64Data = image.replace(/^data:image\/png;base64,/, '');

        // ส่งรูปภาพไปให้ Gemini วิเคราะห์
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    inlineData: {
                        mimeType: 'image/png',
                        data: base64Data
                    }
                },
                {
                    text: `คุณกำลังเล่นเกมทายภาพวาดกับผู้เล่น โจทย์ที่ผู้เล่นต้องวาดคือ "${targetWord}" 
ดูรูปภาพนี้แล้ววิเคราะห์ว่ารูปนี้คืออะไร ตอบกลับมาเป็นชื่อสิ่งของหรือคำสั้นๆ ภาษาไทยคำเดียวเท่านั้น ห้ามมีประโยคอื่นยาวๆ ถ้าใกล้เคียงหรือสื่อถึงคำว่า "${targetWord}" ให้ตอบคำนั้นทันที`
                }
            ]
        });

        const aiGuess = response.text ? response.text.trim() : "";
        console.log(`โจทย์: ${targetWord} | AI ตอบว่า: ${aiGuess}`);

        res.json({ guess: aiGuess });

    } catch (error) {
        console.error('Error calling Gemini API:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการประมวลผลของ AI' });
    }
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});