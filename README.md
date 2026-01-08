# NopCommerce Demo Store Testing

Automation tests for the NopCommerce Demo Store.

## About

This project was developed as part of a group project for the Formal Methods course at university.


## Installation

```bash
git clone <repository-url>
cd searchTest_selenium
npm install
```

## Running Tests

```bash
npm test
```

## Documentation

All project-related documents can be found in the Dokumentacija folder.

## Troubleshooting

Sometimes when running Selenium tests for the first time, you may encounter a **"Verify you are human"** page (a security challenge). This is not an error in the tests.

Follow these steps:

1. Don't touch anything in the Selenium Chrome window (just close it by clicking X).

2. Stop the test in the terminal:
   ```bash
   Ctrl + C
3. Manually open Chrome (regular Chrome, not Selenium):
     - Open Chrome
     - Go to: https://demo.nopcommerce.com/
     - If prompted:
     - Cookie banner → click Accept
     - Human verification → complete it manually
4. Close that Chrome window.
5. Run the tests again:
  ```bash
  npm test
  ```
