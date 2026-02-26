const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    let browser;
    try {
        console.log('Launching browser...');
        browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();

        // Use a standard desktop viewport
        await page.setViewport({ width: 1440, height: 1080 });

        const liveUrl = 'https://mystic-mountain-99.vercel.app';
        console.log(`Navigating to ${liveUrl}...`);
        await page.goto(liveUrl, { waitUntil: 'networkidle2' });

        // 1. Capture initial state
        const initialPath = path.resolve(__dirname, 'public', 'initial_state.png');
        await page.screenshot({ path: initialPath, fullPage: true });
        console.log('Initial state screenshot saved to ' + initialPath);

        // 2. Upload and generate
        console.log('Uploading PDF...');
        const fileInput = await page.$('input[type="file"]');
        if (!fileInput) throw new Error("File input not found");
        await fileInput.uploadFile(path.resolve(__dirname, 'valid_sample.pdf'));

        console.log('Clicking generate button...');
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const generateBtn = buttons.find(b => b.innerText.includes('Generate Magic Quiz'));
            if (generateBtn) generateBtn.click();
        });

        console.log('Waiting for quiz generation (this takes a moment)...');
        // Wait for the "Question 1 of" text
        await page.waitForFunction(
            () => document.body.innerText.includes('Question 1'),
            { timeout: 90000 }
        );

        // 3. Select an option to show the "Selected" state
        console.log('Selecting an option...');
        await page.evaluate(() => {
            const options = Array.from(document.querySelectorAll('button')).filter(b => b.querySelector('span'));
            if (options.length > 0) options[0].click();
        });

        // Wait for explanation or selection state to render
        await new Promise(r => setTimeout(r, 1000));

        const quizPath = path.resolve(__dirname, 'public', 'quiz_state.png');
        await page.screenshot({ path: quizPath, fullPage: true });
        console.log('Quiz state screenshot saved to ' + quizPath);

    } catch (e) {
        console.error('ERROR during screenshot process:', e);
    } finally {
        if (browser) await browser.close();
    }
})();
