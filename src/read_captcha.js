import Tesseract from "tesseract.js";

export async function readCaptcha(url) {
    const { data: { text } } = await Tesseract.recognize(url);

    return text.trim();
}