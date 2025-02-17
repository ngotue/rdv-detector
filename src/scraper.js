import { Builder, By } from "selenium-webdriver";
import dotenv from 'dotenv';
import fs from "fs";
import { readCaptcha } from "./read_captcha.js";

export async function scraper() {
    let driver = await new Builder().forBrowser("chrome").build();

    try {
        // Open a website
        // Load environment variables from .env file
        dotenv.config();

        // Use the URL from the .env file
        await driver.get(process.env.SCRAPING_URL);

        const linkElements = await driver.findElements(By.css("a"));

        let takeRdvLink

        for(let link of linkElements) {
            let text = await link.getText();
            
            if(text === process.env.TAKE_RDV_TEXT) {
                takeRdvLink = link
            }
        }

        // Click on a link
        await takeRdvLink.click();

        await driver.sleep(2000);

        const captchaImage = await driver.findElement(By.css("#captchaFR_CaptchaImage"));
        const captchaSrc = await captchaImage.getAttribute("src");

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

        // Convert Base64 to binary and save as a PNG file
        const buffer = Buffer.from(base64Image, "base64");

        // Log the size of the buffer
        console.log("Buffer size:", buffer.length);

        // Save the image to a file
        fs.writeFileSync(process.env.GENERATED_PNG_PATH, buffer);

        console.log("Captcha image saved as captcha_image.png");

        const text = readCaptcha(process.env.GENERATED_PNG_PATH);

        console.log("🔍 Extracted CAPTCHA Text:", text.trim());
        
    } finally {
        // Close the browser
        // await driver.quit();
    }
};
