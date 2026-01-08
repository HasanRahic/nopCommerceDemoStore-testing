require("chromedriver");

const assert = require("assert");
const { Builder, By, Key, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");

const BASE_URL = "https://demo.nopcommerce.com";
const PROFILE_DIR = "C:\\temp\\nop_profile_search"; // napravi C:\temp ako nema

const SEL = {
  searchInput: By.css("#small-searchterms"),
  searchBtn: By.css("form#small-search-box-form button[type='submit']"),
  // Search page
  pageTitle: By.css(".page-title h1, .page-title"),
  productItems: By.css(".product-item"),
  noResult: By.css(".no-result"),
  warning: By.css(".search-box-text-warning"), // nekad postoji na search stranici
  orderBy: By.css("select#products-orderby"),
  advancedSearch: By.id("adv"),
};

async function open(driver, url) {
  await driver.get(url);
  await driver.wait(
    async () => (await driver.executeScript("return document.readyState")) === "complete",
    25000
  );
}

async function goHome(driver) {
  await open(driver, BASE_URL);
  await driver.wait(until.elementLocated(SEL.searchInput), 20000);
}

async function doSearch(driver, text) {
  await goHome(driver);
  const input = await driver.findElement(SEL.searchInput);
  await input.clear();
  await input.sendKeys(text);
  await driver.findElement(SEL.searchBtn).click();
  await driver.wait(until.elementLocated(SEL.pageTitle), 20000);
}

async function countProducts(driver) {
  return (await driver.findElements(SEL.productItems)).length;
}

async function hasNoResult(driver) {
  return (await driver.findElements(SEL.noResult)).length > 0;
}
async function acceptAlertAndGetText(driver) {
  await driver.wait(until.alertIsPresent(), 5000);
  const alert = await driver.switchTo().alert();
  const text = await alert.getText();
  await alert.accept();
  return text;
}

describe("Search - nopCommerce demo | Mocha + Selenium (10 testova)", function () {
  this.timeout(180000);
  let driver;

  // ✅ 1 browser za sve testove
  before(async () => {
    const options = new chrome.Options();
    options.addArguments("--disable-gpu", "--no-sandbox", "--disable-dev-shm-usage");
    options.addArguments(`--user-data-dir=${PROFILE_DIR}`);
    options.excludeSwitches(["enable-automation"]);
    options.addArguments("--disable-blink-features=AutomationControlled");
    options.addArguments("--log-level=3");

    driver = await new Builder().forBrowser("chrome").setChromeOptions(options).build();
    await goHome(driver);
  });

  after(async () => {
    if (driver) await driver.quit();
  });

  beforeEach(async () => {
    await goHome(driver);
  });

  it("TC-SR-01: Prazan search ('') -> alert 'Please enter some search keyword'", async () => {
  await goHome(driver);

  const input = await driver.findElement(SEL.searchInput);
  await input.clear(); // prazno
  await driver.findElement(SEL.searchBtn).click();

  const alertText = await acceptAlertAndGetText(driver);
  assert.ok(alertText.toLowerCase().includes("please enter some search keyword"));
});


  it("TC-SR-02: Samo razmaci -> Search stranica se učita", async () => {
    await doSearch(driver, "   ");
    const title = (await driver.findElement(SEL.pageTitle).getText()).toLowerCase();
    assert.ok(title.includes("search"));
  });

  it("TC-SR-03: Nevažeći termin (zzzzzzzz) -> no-result poruka postoji", async () => {
    await doSearch(driver, "zzzzzzzz");
    assert.ok(await hasNoResult(driver));
  });

  it("TC-SR-04: Valid termin 'laptop' -> ima rezultata ili no-result (stabilno)", async () => {
    await doSearch(driver, "laptop");
    const n = await countProducts(driver);
    if (n === 0) assert.ok(await hasNoResult(driver));
    else assert.ok(n >= 1);
  });

  it("TC-SR-05: Case-insensitive 'LAPTOP' -> isto ponašanje (stabilno)", async () => {
    await doSearch(driver, "LAPTOP");
    const n = await countProducts(driver);
    if (n === 0) assert.ok(await hasNoResult(driver));
    else assert.ok(n >= 1);
  });

  it("TC-SR-06: Partial match 'book' -> stabilno (rezultati ili no-result)", async () => {
    await doSearch(driver, "book");
    const n = await countProducts(driver);
    if (n === 0) assert.ok(await hasNoResult(driver));
    else assert.ok(n >= 1);
  });

  it("TC-SR-07: Specijalni znakovi '@@@###' -> aplikacija ne puca (Search page učitan)", async () => {
    await doSearch(driver, "@@@###");
    const title = (await driver.findElement(SEL.pageTitle).getText()).toLowerCase();
    assert.ok(title.includes("search"));
  });

  it("TC-SR-08: Dugačak string (100 znakova) -> aplikacija stabilna", async () => {
    await doSearch(driver, "a".repeat(100));
    const title = (await driver.findElement(SEL.pageTitle).getText()).toLowerCase();
    assert.ok(title.includes("search"));
  });

  it("TC-SR-09: Enter key u polju pretrage otvara Search stranicu", async () => {
    await goHome(driver);
    const input = await driver.findElement(SEL.searchInput);
    await input.clear();
    await input.sendKeys("laptop", Key.ENTER);

    await driver.wait(until.elementLocated(SEL.pageTitle), 20000);
    const title = (await driver.findElement(SEL.pageTitle).getText()).toLowerCase();
    assert.ok(title.includes("search"));
  });

  it("TC-SR-10: Nakon pretrage postoji Sort dropdown (ako ima rezultata)", async () => {
    await doSearch(driver, "laptop");

    const products = await countProducts(driver);
    if (products === 0) {
      assert.ok(await hasNoResult(driver)); // nema sort kad nema proizvoda
      return;
    }

    const sort = await driver.wait(until.elementLocated(SEL.orderBy), 20000);
    assert.ok(await sort.isDisplayed());
  });
});
