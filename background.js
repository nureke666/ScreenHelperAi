// НАСТРОЙКИ
const API_KEYS = [
    // api keys
];

// Индекс текущего ключа
let currentKeyIndex = 0;

// Функция получения следующего ключа (ротация)
function getNextKey() {
    const key = API_KEYS[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
    console.log(`Использую ключ #${currentKeyIndex + 1}`);
    return key;
}

// Слушатель команд (хоткеев)
chrome.commands.onCommand.addListener(async (command) => {
    if (command === "solve-screen") {
        try {
            // 1. Получаем текущую вкладку
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab) return;

            // 2. Делаем скриншот видимой части
            const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: "jpeg", quality: 80 });
            
            // Убираем префикс "data:image/jpeg;base64," для отправки в API
            const base64Image = dataUrl.split(",")[1];

            // 3. Отправляем запрос к Gemini
            await processWithGemini(tab.id, base64Image);

        } catch (error) {
            console.error("Ошибка в background:", error);
        }
    }
});

async function processWithGemini(tabId, base64Image) {
    const apiKey = getNextKey();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const promptText = `
    Посмотри на скриншот. Это тест или викторина.
    Проанализируй вопросы и варианты ответов.
    Твоя задача — дать только правильные ответы.
    
    СТРОГИЙ ФОРМАТ ОТВЕТА (без лишних слов, без markdown, просто текст):
    1A, 2B, 3C, 4TRUE
    
    Если вопрос один, просто напиши букву или ответ.
    `;

    const payload = {
        contents: [{
            parts: [
                { text: promptText },
                {
                    inline_data: {
                        mime_type: "image/jpeg",
                        data: base64Image
                    }
                }
            ]
        }]
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        // Парсим ответ
        let aiText = "Ошибка получения ответа";
        if (data.candidates && data.candidates[0].content) {
            aiText = data.candidates[0].content.parts[0].text.trim();
        }

        // 4. Отправляем результат в content script для копирования
        chrome.tabs.sendMessage(tabId, { action: "copyResult", text: aiText });

    } catch (error) {
        console.error("Ошибка API:", error);
        chrome.tabs.sendMessage(tabId, { action: "copyResult", text: "Error: " + error.message });
    }
}