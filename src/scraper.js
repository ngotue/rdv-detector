import { Builder, By } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";
import dotenv from 'dotenv';
import fs from 'fs'
import { readCaptcha } from "./read_captcha.js";
import sharp from "sharp";
import axios from "axios";


export async function scraper() {
    const capturedCaptchaUrl = 'generated/captcha_image.png'
    const enhancedImgUrl = 'generated/captcha_image_processed.png'
    const captchaId = process.env.CAPTCHA_IMG_ID

    const options = new chrome.Options();
    options.addArguments("--disable-blink-features=AutomationControlled"); // Prevents detection
    options.addArguments("--start-maximized"); // Opens browser maximized
    let driver = await new Builder().forBrowser("chrome").setChromeOptions(options).build();

    const userAgents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36"
    ];
    
    const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
    await driver.executeScript(`navigator.__defineGetter__('userAgent', () => '${randomUserAgent}')`);

    try {
        // Open a website
        // Load environment variables from .env file
        dotenv.config();

        // Use the URL from the .env file
        await driver.get(process.env.SCRAPING_URL);

        await driver.sleep(Math.random() * 3000 + 2000);

        const linkElements = await driver.findElements(By.css("a"));

        let takeRdvLink

        for(let link of linkElements) {
            let text = await link.getText();
            
            if(text === process.env.TAKE_RDV_TEXT) {
                takeRdvLink = link
            }
        }

        await driver.sleep(Math.random() * 3000 + 1000)

        // Click on a link
        await takeRdvLink.click();

        await driver.sleep(2000);

        const base64Image = await driver.executeScript(() => {
            const img = document.querySelector("#captchaFR_CaptchaImage");
            if (!img) {
                return null;
            }

            // Convert image to Base64
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");

            ctx.drawImage(img, 0, 0);
            return canvas.toDataURL("image/png").split(",")[1]; // Remove "data:image/png;base64,"
        });

        if (!base64Image) {
            console.error("Failed to extract CAPTCHA.");
            return;
        }

        fs.writeFileSync('generated/captcha_base64.txt', base64Image)

        // Convert Base64 to binary and save as a PNG file
        const buffer = Buffer.from(base64Image, "base64");

        // Log the size of the buffer
        // console.log("Buffer size:", buffer.length);

        // Save the image to a file
        fs.writeFileSync(capturedCaptchaUrl, buffer);

        console.log("Captcha image saved as captcha_image.png");

        let text = ""

        axios.post('https://api.capmonster.cloud/createTask')

        // await sharp(buffer)
        //     .grayscale() // Convert to grayscale
        //     .threshold(120) // Apply thresholding (adjust value as needed)
        //     .toFile(enhancedImgUrl);

        // const text = await readCaptcha(capturedCaptchaUrl);

        console.log("🔍 Extracted CAPTCHA Text:", text);
        
    } finally {
        // Close the browser
        await driver.quit();
    }
};
