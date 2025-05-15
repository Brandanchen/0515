// 動畫設定
const canvas = document.getElementById('animationCanvas');
const ctx = canvas.getContext('2d');

// 設置canvas大小
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// 雷達掃描效果
let angle = 0;
const centerX = window.innerWidth / 2;
const centerY = window.innerHeight / 2;
const maxRadius = Math.max(window.innerWidth, window.innerHeight);

// 動畫循環
function animate() {
    // 清除畫布但保留一點前一幀的殘影
    ctx.fillStyle = 'rgba(0, 8, 7, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 繪製網格
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.1)';
    ctx.lineWidth = 1;

    // 繪製同心圓
    for (let r = 50; r < maxRadius; r += 50) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        ctx.stroke();
    }

    // 繪製十字準線
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, canvas.height);
    ctx.moveTo(0, centerY);
    ctx.lineTo(canvas.width, centerY);
    ctx.stroke();    // 移除了掃描線和掃描扇形，保持清爽的網格效果

    // 更新角度
    angle += 0.01;
    if (angle > Math.PI * 2) {
        angle = 0;
    }

    requestAnimationFrame(animate);
}
animate();

// API 配置
const API_KEY = 'AIzaSyD-oI5kU6_DLS0lm9si55T1QIwiArLa1JQ';
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

let conversationHistory = [];

// 初始化語音識別
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let isRecording = false;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'zh-TW';
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        document.getElementById('userInput').value = transcript;
        stopRecording();
    };
    
    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        stopRecording();
    };
    
    recognition.onend = () => {
        stopRecording();
    };
} else {
    console.log('Speech recognition not supported');
}

function toggleSpeechRecognition() {
    if (!recognition) {
        alert('您的瀏覽器不支援語音識別功能');
        return;
    }
    
    if (!isRecording) {
        startRecording();
    } else {
        stopRecording();
    }
}

function startRecording() {
    isRecording = true;
    const micButton = document.getElementById('micButton');
    micButton.classList.add('recording');
    recognition.start();
}

function stopRecording() {
    isRecording = false;
    const micButton = document.getElementById('micButton');
    micButton.classList.remove('recording');
    if (recognition) {
        recognition.stop();
    }
}

async function callGoogleAI(userInput) {
    try {
        console.log('Sending request to:', API_URL);
        const response = await fetch(`${API_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{                        text: `你是一個專業的軍事與地理資訊助手。請針對使用者的問題提供專業、準確且詳細的回答。回答需要：
1. 資訊準確且具有公信力
2. 條理分明，易於理解
3. 適當地加入相關的軍事或地理背景知識
4. 保持客觀中立的立場

使用者的問題是：${userInput}

請提供完整的回答：`
                    }]
                }]
            })
        });

        if (!response.ok) {
            throw new Error('API 請求失敗');
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error('Error:', error);
        return '抱歉，發生錯誤，請稍後再試。';
    }
}

function addMessageToDisplay(text, isUser) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
    messageDiv.textContent = text;
    
    const container = document.getElementById('storyContainer');
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
    
    conversationHistory.push({
        role: isUser ? 'user' : 'ai',
        text: text
    });
}

async function sendMessage() {
    const inputElement = document.getElementById('userInput');
    const userInput = inputElement.value.trim();
    
    if (userInput === '') return;
    
    addMessageToDisplay(userInput, true);
    inputElement.value = '';
    inputElement.disabled = true;
    
    const aiResponse = await callGoogleAI(userInput);
    addMessageToDisplay(aiResponse, false);
    
    inputElement.disabled = false;
    inputElement.focus();
}

function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}
