import http from 'k6/http'

import { sleep, check, fail } from 'k6'
import exec from 'k6/execution'
import { browser } from 'k6/browser'

const WORDS = require('./words.js')
const timeoutMS = 5000

//TODO: Set the correct API endpoint
const TARGET_URL = __ENV.TARGET_URL || 'http://books-192.168.39.200.nip.io'

const intBetween = function(min = 5, max = 10) {
  return Math.floor(Math.random() * (max - min)) + min
}
const intBetweenExclusive = function(count) {
  return Math.floor(Math.random() * count)
}

function randomSearchWords() {
  return WORDS[intBetween(0, WORDS.length - 1)]
}

export const options = {
  scenarios: {
    ui: {
      vus: 2,
      duration: '0s',
      executor: 'externally-controlled',
      options: {
        browser: { type: 'chromium' }
      }
    }
  }
}

export function setup() {
  const resp = http.get(TARGET_URL)
  const result = check(resp, {
    'Accessible?': r => 200 == r.status
  })
  if (!result)
    exec.test.abort(`Cannot access ${TARGET_URL}. Got ${resp.status} code`)
}


export default async function() {

  const context = await browser.newContext()
  context.setDefaultTimeout(timeoutMS)
  const page = await context.newPage()

  try {
    await page.goto(TARGET_URL)

    // Wait for main view
    await page.waitForSelector('app-main')

    await page.locator('#main_search_input').fill(randomSearchWords())
    await page.locator('#main_search_btn').click()

    // Wait for search view
    await page.waitForSelector('app-search')

    await page.waitForSelector('a.search_book_a', '#search_error_h3', '#search_no_books_h2')
    // Server error or not found - stop
    if ((await page.locator('#search_error_h3').isVisible()) || (await page.locator('#search_no_books_h2').isVisible()))
      return

    const books = await page.locator('a.search_book_a').all()
    const idx = intBetweenExclusive(books.length)
    await books[idx].click()

    // Wait for details page
    await page.waitForSelector('app-detail')

    await page.waitForSelector('table', '#detail_error_h3')

    sleep(intBetween(2, 5))

  } catch (error) {
    console.error('>>> error: ', error)
  } finally {
    await context.close()
  }
}
