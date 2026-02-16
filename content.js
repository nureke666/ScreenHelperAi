chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "copyResult") {
        showGhostText(request.text);
    }
});

function showGhostText(text) {
    const old = document.getElementById("hackathon-text");
    if (old) old.remove();

    const div = document.createElement("div");
    div.id = "hackathon-text";
    div.innerText = text;

    // Авто-определение цвета (как в прошлый раз, но упрощено)
    // Мы берем тупо противоположный цвет от фона, но гасим его прозрачностью
    const bgColor = window.getComputedStyle(document.body).backgroundColor;
    const textColor = isDark(bgColor) ? "rgba(255, 255, 255, 1)" : "rgba(0, 0, 0, 1)";

    Object.assign(div.style, {
        position: "fixed",
        bottom: "0px",          // Прижат к самому низу
        right: "0px",           // Прижат к самому краю
        zIndex: "2147483647",
        
        color: textColor,
        background: "transparent",
        
        fontSize: "13px",       // ОЧЕНЬ мелкий текст (как системная инфа)
        fontFamily: "sans-serif",
        fontWeight: "normal",
        
        padding: "2px 5px",
        maxWidth: "200px",
        whiteSpace: "pre-wrap",
        
        // --- ГЛАВНАЯ ФИШКА ---
        opacity: "0.04",        // Почти полная невидимость (выглядит как пыль)
        transition: "opacity 0.2s", // Плавное появление
        cursor: "default",
        pointerEvents: "auto"   // ВАЖНО: разрешаем мышке видеть элемент
    });

    // Логика проявления при наведении
    div.onmouseenter = () => {
        div.style.opacity = "0.8"; // Становится видимым
        div.style.background = isDark(bgColor) ? "rgba(0,0,0,0.8)" : "rgba(255,255,255,0.8)"; // Добавляем фон для читаемости
    };
    
    div.onmouseleave = () => {
        div.style.opacity = "0.04"; // Снова исчезает
        div.style.background = "transparent";
    };

    document.body.appendChild(div);

    // Удаляем через 30 секунд (даем время списать)
    setTimeout(() => {
        if(div) div.remove();
    }, 20000);
}

// Простая проверка: темный фон или светлый?
function isDark(color) {
    // Если прозрачный или не найден - считаем светлым
    if (!color || color.includes('rgba(0, 0, 0, 0)')) return false; 
    
    const match = color.match(/\d+/g);
    if (!match) return false;
    
    const r = parseInt(match[0]);
    const g = parseInt(match[1]);
    const b = parseInt(match[2]);
    
    // Формула яркости
    return (r * 0.299 + g * 0.587 + b * 0.114) < 128;
}