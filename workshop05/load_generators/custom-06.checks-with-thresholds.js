import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Counter } from "k6/metrics";

const BASE_URL = __ENV.BASE_URL || 'http://quickpizza-public-api-163.47.11.97.nip.io';

export const options = {
  scenarios: {
    fixed_iterations: {
      executor: 'constant-vus',
      // TODO: Task 6 - increase number of vus
      vus: 2,
      duration: '15m'
    }
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    quickpizza_ingredients: [{ threshold: 'avg<8', abortOnFail: false }],
    checks: ["rate > 0.95"]
  },
};

const pizzas = new Counter('quickpizza_number_of_pizzas');
const ingredients = new Trend('quickpizza_ingredients');

export function setup() {
  let res = http.get(BASE_URL)
  if (res.status !== 200) {
    throw new Error(`Got unexpected status code ${res.status} when trying to setup. Exiting.`)
  }
}

export default function () {
  let restrictions = {
    maxCaloriesPerSlice: 500,
    mustBeVegetarian: false,
    excludedIngredients: ["pepperoni"],
    excludedTools: ["knife"],
    maxNumberOfToppings: 6,
    minNumberOfToppings: 2
  }
  let res = http.post(`${BASE_URL}/api/pizza`, JSON.stringify(restrictions), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'token abcdef0123456789',
    },
  });
  if (check(res, { "status is 200": (res) => res.status === 200 })) {
    console.log(`${res.json().pizza.name} (${res.json().pizza.ingredients.length} ingredients)`);
    pizzas.add(1);
    ingredients.add(res.json().pizza.ingredients.length);
  } 
  sleep(1);
}

export function teardown() {
  // TODO: Send notification to Slack
  console.log("That's all folks!")
}
