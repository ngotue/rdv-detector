import Tesseract from "tesseract.js";

export async function readCaptcha(url) {
    const { data: { text } } = await Tesseract.recognize(url, {
        logger: (m) => console.log(m) // Log progress
    });

    return text.trim();
}