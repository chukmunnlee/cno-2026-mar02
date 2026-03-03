import http from 'k6/http'
import { sleep, check } from 'k6'

import getOptions from './scenarios.js'

const WORDS = require('./words.js')

//TODO: Set the correct API endpoint
const TARGET_URL = __ENV.TARGET_URL || 'http://localhost:5000'

const intBetween = function(min = 5, max = 10) {
  return Math.floor(Math.random() * (max - min)) + min
}

export const options = {
  scenarios: {
    load_generation: getOptions(__ENV.SCENARIO || 'externallyControlled')
  }
}

export default function() {

  let c = intBetween(10, 20)
  let resp = http.get(`${TARGET_URL}/api/books?count=${c}`)
  
  let result = check(resp, 
    { 'OK': r => r.status <= 299 }
  )

  if (result) {
    const bookList = resp.json().result
    const rand = Math.random();
    if (rand < .7) {
      const isbn13 = bookList[intBetween(0, c - 1)].isbn13
      resp = http.get(`${TARGET_URL}/api/book/${isbn13}`)
    } else {
      const wIdx = intBetween(0, WORDS.length - 1)
      resp = http.get(`${TARGET_URL}/api/search?q=${WORDS[wIdx]}`)
    }
  }

  sleep(intBetween())
}

