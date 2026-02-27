const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Set viewport to a typical desktop size. 
    // We can reduce zoom if needed, but fullPage screenshot will capture to the footer.
    await page.setViewport({ width: 1440, height: 1080, deviceScaleFactor: 1 });

    await page.goto('https://mystic-mountain-99.vercel.app', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));

    // Take full page screenshot
    await page.screenshot({ path: 'public/initial_state.png', fullPage: true });

    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const btn = btns.find(b => b.textContent && b.textContent.includes('Quiz on Current Affairs'));
        if (btn) btn.click();
    });

    try {
        await page.waitForFunction(() => {
            return document.body.innerHTML.includes('Question 1 of');
        }, { timeout: 45000 });
        await new Promise(r => setTimeout(r, 2000));
        // Full page screenshot of the quiz
        await page.screenshot({ path: 'public/quiz_state.png', fullPage: true });
        console.log('SUCCESS: Captured quiz state');
    } catch (e) {
        console.log('Timeout waiting for quiz state', e);
    }

    await browser.close();
})();
