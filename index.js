require("dotenv").config()
const { chromium, devices } = require('playwright');
const iPhone = devices['iPhone 11 Pro'];
let bought = false;
let fails = 0;

function getDate() {
    let d = new Date()
    return d.toLocaleString()
}

async function Main() {
    let browser;
    let page;

    try {
        browser = await chromium.launch({headless: false, slowMo: 1000});
        const context = await browser.newContext({
            ...iPhone,
            permissions: ['geolocation'],
            geolocation: { latitude: 35.8393, longitude: 84.27},
            colorScheme: 'dark',
            locale: 'en-US'
        });
        page = await context.newPage();
        await page.route('**/*', (route) => {
            return route.request().resourceType() === 'image'
              ? route.abort()
              : route.continue()
        })

        await page.goto('https://www.bestbuy.com/site/lg-5-0-cu-ft-high-efficiency-smart-top-load-washer-with-turbowash3d-technology-graphite-steel/6321758.p?skuId=6321758', { waitUntil: 'domcontentloaded' });
        // await page.goto('https://www.bestbuy.com/site/evga-geforce-rtx-3080-xc3-ultra-gaming-10gb-gddr6-pci-express-4-0-graphics-card/6432400.p?skuId=6432400', {waitUntil: 'domcontentloaded'});
        let soldOutButton = await page.$('"Sold Out"');

        if (!soldOutButton && bought === false) {

            console.log('Product in Stock', await page.title());

            await page.click('.add-to-cart-button');

            await page.waitForSelector('a:has-text("Go to Cart")', { timeout: 2000 }).catch(err => {
                fails += 1;
                throw Error('add to cart failed, Bot detected, Trying again...')
            })

            await page.click('a:has-text("Go to Cart")');
            console.log('Product succesfully added to cart');

            await page.click('#fulfillment-order-shipping');
            console.log('Changing shipping');

            await page.click("xpath=//button[contains(., 'Checkout')]");
            console.log('Checking out...');

            await page.fill('#fld-e', process.env.USERNAME);
            await page.fill('#fld-p1', process.env.PASS);
            
            await page.click('"Sign In"')
            await page.waitForLoadState();
            console.log('new page loaded');
            
            await page.waitForTimeout(1000000);
            return
        }

        console.log('NO STOCK: ', getDate());

    } catch(e) {
        console.log(e)
    } finally {

        if (!bought) {
            console.log('Product Succesfully purchased...')
            process.abort()
        }

        await page.close();

        if (fails > 3) {
            console.log('fail counter up to 3, waiting 10 seconds to try again...')
            setTimeout(() => {
                Main();
            }, 10000)
            if (fails > 5) fails = 0;
            return
        } else if (fails <= 3){
            Main();
            return
        }
    }

}

Main()
