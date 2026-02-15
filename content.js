chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "copyResult") {
        showText(request.text);
    }
});

function showText(text) {
    const old = document.getElementById("hackathon-text");
    if (old) old.remove();

    const div = document.createElement("div");
    div.id = "hackathon-text";
    div.innerText = text;

    Object.assign(div.style, {
        position: "fixed",
        bottom: "10px",
        right: "10px",
        zIndex: "2147483647",
        color: "rgba(255, 255, 255, 0.39)",
        fontSize: "14px",
        fontFamily: "monospace",
        whiteSpace: "pre-wrap",
        maxWidth: "400px",
        pointerEvents: "none"
    });

    document.body.appendChild(div);

    setTimeout(() => {
        div.remove();
    }, 5000);
}
