const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

    // Navigate to local dev server
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

    // Ensure dark mode is active for the first screenshot
    await page.evaluate(() => {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
    });

    // Wait for animations
    await new Promise(r => setTimeout(r, 1000));

    // Wait for the "Practice Quizzes" button to be active and visible
    await page.waitForFunction(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Practice Quizzes'));
        if (btn) {
            btn.click();
            return true;
        }
        return false;
    });

    await new Promise(r => setTimeout(r, 500));

    // Screenshot dark mode Quiz section
    await page.screenshot({ path: path.join(__dirname, 'public', 'quiz_dark.png') });

    // Switch to light mode
    await page.evaluate(() => {
        document.documentElement.classList.remove('dark');
    });

    await new Promise(r => setTimeout(r, 1000));

    // Click "Study Flashcards" button
    await page.waitForFunction(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Study Flashcards'));
        if (btn) {
            btn.click();
            return true;
        }
        return false;
    });

    await new Promise(r => setTimeout(r, 500));

    // Screenshot light mode Flashcard section
    await page.screenshot({ path: path.join(__dirname, 'public', 'flashcards_light.png') });

    console.log('Screenshots captured: quiz_dark.png and flashcards_light.png');
    await browser.close();
})();
