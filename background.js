const API_KEYS = [
    // api keys
];

// Функция получения ключа с сохранением в storage
async function getNextKey() {
    // Получаем сохраненный индекс
    const data = await chrome.storage.local.get("keyIndex");
    let currentIndex = data.keyIndex || 0;

    const key = API_KEYS[currentIndex];
    
    // Вычисляем следующий и сохраняем
    const nextIndex = (currentIndex + 1) % API_KEYS.length;
    await chrome.storage.local.set({ keyIndex: nextIndex });
    
    console.log(`Использую ключ #${currentIndex + 1}`);
    return key;
}

chrome.commands.onCommand.addListener(async (command) => {
    if (command === "solve-screen") {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab) return;

            const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: "jpeg", quality: 80 });
            const base64Image = dataUrl.split(",")[1];

            await processWithGemini(tab.id, base64Image);

        } catch (error) {
            console.error("BG Error:", error);
        }
    }
});

async function processWithGemini(tabId, base64Image) {
    try {
        // Теперь getNextKey асинхронная, ставим await
        const apiKey = await getNextKey();
        
        // Используем 1.5-flash (он стабильный и быстрый)
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        const promptText = `
        Твоя задача — решить тест на картинке.
        Верни ТОЛЬКО ответы в формате: 1A, 2B, 3C.
        Не пиши объяснений.
        `;

        const payload = {
            contents: [{
                parts: [
                    { text: promptText },
                    { inline_data: { mime_type: "image/jpeg", data: base64Image } }
                ]
            }]
        };

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        let aiText = "Нет ответа";

        if (data.candidates && data.candidates[0].content) {
            aiText = data.candidates[0].content.parts[0].text.trim();
        }

        chrome.tabs.sendMessage(tabId, { action: "copyResult", text: aiText })
            .catch(() => console.log("Вкладка недоступна"));

    } catch (error) {
        console.error("API Error:", error);
        chrome.tabs.sendMessage(tabId, { action: "copyResult", text: "Error" });
    }
}