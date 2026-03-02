const shareInteractions = {
  executor: "shared-iterations",
  vus: 4,
  iterations: 100,
  options: {
    browser: {
      type: "chromium",
    },
  }
}

const constantArrivalRate = {
  executor: 'constant-arrival-rate',
  rate: 5,
  timeUnit: '1s',
  duration: '10m',
  preAllocatedVUs: 2,
  maxVUs: 10
}

const externallyControlled =  {
  executor: 'externally-controlled',
  vus: 2,
  duration: '0s',
}

function getOptions(optStr = "shareInteractions") {

  console.info(`Executors: ${optStr}`)

  switch (optStr) {
    case "constantArrivalRate":
      return constantArrivalRate

    case "externallyControlled":
      return externallyControlled

    case "shareInteractions":
    default:
      return shareInteractions
  }
}

export default getOptions

