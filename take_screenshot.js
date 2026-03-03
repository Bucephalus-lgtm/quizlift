const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

    // Navigate to local dev server
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

    // 1. QUIZ - DARK MODE
    console.log("Setting dark mode...");
    await page.evaluate(() => {
        document.documentElement.classList.add('dark');
        document.documentElement.style.colorScheme = 'dark';
    });

    await new Promise(r => setTimeout(r, 1000));

    console.log("Clicking Quiz button...");
    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const quizBtn = btns.find(b => b.textContent && b.textContent.includes('Practice Quizzes'));
        if (quizBtn) quizBtn.click();
    });

    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(__dirname, 'public', 'quiz_dark.png') });
    console.log("Saved quiz_dark.png");

    // 2. FLASHCARDS - LIGHT MODE
    console.log("Setting light mode...");
    await page.evaluate(() => {
        document.documentElement.classList.remove('dark');
        document.documentElement.style.colorScheme = 'light';
    });

    await new Promise(r => setTimeout(r, 1000));

    console.log("Clicking Flashcards button...");
    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const flashcardBtn = btns.find(b => b.textContent && b.textContent.includes('Study Flashcards'));
        if (flashcardBtn) flashcardBtn.click();
    });

    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(__dirname, 'public', 'flashcards_light.png') });
    console.log("Saved flashcards_light.png");

    await browser.close();
})();
