const Alexa = require('ask-sdk-core');
const persistenceAdapter = require('ask-sdk-s3-persistence-adapter');
var axios = require('axios');

const fetchDataOnStateUrl = 'https://corona.lmao.ninja/v2/states/STATE_NAME?yesterday=IS_YESTERDAY';
const fetchDataOnGlobalUrl = 'https://corona.lmao.ninja/v2/all?yesterday=true';
const fetchDataOnCountryUrl = 'https://corona.lmao.ninja/v2/countries/COUNTRY_NAME?yesterday=true&strict=false';
const fetchDataOnTopCountiresWithCasesUrl = 'https://corona.lmao.ninja/v2/countries?yesterday=false&sort=cases';
const fetchDataOnTopStatesWithCasesUrl = 'https://corona.lmao.ninja/v2/states?sort=cases&yesterday=false';

const fetchDataOnState = async (state, isYesterday) => {
  try {
    var requestUrl = fetchDataOnStateUrl
                        .replace("STATE_NAME", encodeURIComponent(state.trim()))
                        .replace("IS_YESTERDAY", isYesterday === true ? "true" : "false");
    const { data } = await axios.get(requestUrl);
    return data;
  } catch (error) {
    console.error('cannot fetch quotes', error);
  }
};

const fetchDataOnGlobal = async () => {
  try {
    const { data } = await axios.get(fetchDataOnGlobalUrl);
    return data;
  } catch (error) {
    console.error('cannot fetch quotes', error);
  }
};

const fetchDataOnCountry = async (country) => {
  try {
    var requestUrl = fetchDataOnCountryUrl
                        .replace("COUNTRY_NAME", encodeURIComponent(country.trim()));
    const { data } = await axios.get(requestUrl);
    return data;
  } catch (error) {
    console.error('cannot fetch quotes', error);
  }
};

const fetchDataOnTopCountiresWithCases = async () => {
  try {
    const { data } = await axios.get(fetchDataOnTopCountiresWithCasesUrl);
    return data;
  } catch (error) {
    console.error('cannot fetch quotes', error);
  }
};

const fetchDataOnTopStatesWithCases = async () => {
  try {
    const { data } = await axios.get(fetchDataOnTopStatesWithCasesUrl);
    return data;
  } catch (error) {
    console.error('cannot fetch quotes', error);
  }
};

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speakOutput = 'Hello! What do you want to know about coronavirus cases?';
        const repromptText = 'You can say how many cases of coronavirus have been reported?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(repromptText)
            .getResponse();
    }
};

const CurrentStateIntentHandler = {
    canHandle(handlerInput) {
        const attributesManager = handlerInput.attributesManager;
        const sessionAttributes = attributesManager.getSessionAttributes() || {};
        const userState = sessionAttributes.hasOwnProperty('userState') ? sessionAttributes.userState : 0;
        
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'CaptureCurrentStateIntent'
            && userState;
    },
    async handle(handlerInput) {
        const attributesManager = handlerInput.attributesManager;
        const sessionAttributes = attributesManager.getSessionAttributes() || {};
        const userState = sessionAttributes.hasOwnProperty('userState') ? sessionAttributes.userState : 0;
        
        try {
          const stateDataYesterday = await fetchDataOnState(userState, true);
          const speechText = `As of yesterday, there have been ${stateDataYesterday.todayCases} new cases confirmed of the coronavirus and 
          ${stateDataYesterday.todayDeaths} new deaths in ${userState}. Overall, there has been a total of ${stateDataYesterday.cases} cases 
          and ${stateDataYesterday.deaths} deaths reported in ${userState}`;
    
          return handlerInput.responseBuilder
            .speak(speechText)
            .getResponse();
        } catch (error) {
          console.error(error);
        }
    }
}

const CaptureStateIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'CaptureStateIntent';
    },
    async handle(handlerInput) {
        const state = handlerInput.requestEnvelope.request.intent.slots.state.value;
        
        //Persist user's state info
        const attributesManager = handlerInput.attributesManager;
        const userAttributes = {
            "userState": state
        };
        attributesManager.setPersistentAttributes(userAttributes);
        await attributesManager.savePersistentAttributes();

        try {
          const stateDataYesterday = await fetchDataOnState(state, true);
          const speechText = `As of yesterday, there have been ${stateDataYesterday.todayCases} new cases confirmed of the coronavirus and 
          ${stateDataYesterday.todayDeaths} new deaths in ${state}. Overall, there has been a total of ${stateDataYesterday.cases} cases 
          and ${stateDataYesterday.deaths} deaths reported in ${state}`;
    
          return handlerInput.responseBuilder
            .speak(speechText)
            .getResponse();
        } catch (error) {
          console.error(error);
        }
    }
};

const CaptureCountryIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'CaptureCountryIntent';
    },
    async handle(handlerInput) {
        const country = handlerInput.requestEnvelope.request.intent.slots.country.value;

        try {
          const countryData = await fetchDataOnCountry(country);
          const speechText = `As of yesterday, there have been ${countryData.todayCases} new cases confirmed of the coronavirus and 
          ${countryData.todayDeaths} new deaths in ${country}. Overall, there has been a total of ${countryData.cases} cases reported in ${country},
          ${countryData.recovered} of them have recovered and ${countryData.deaths} have died so far`;
    
          return handlerInput.responseBuilder
            .speak(speechText)
            .getResponse();
        } catch (error) {
          console.error(error);
        }
    }
};

const CaptureGlobalIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'CaptureGlobalIntent';
    },
    async handle(handlerInput) {
        try {
          const globalData = await fetchDataOnGlobal();
          const speechText = `As of yesterday, there have been ${globalData.todayCases} new cases confirmed of the coronavirus and 
          ${globalData.todayDeaths} new deaths globally. Overall, there has been a total of ${globalData.cases} cases reported globally,
          ${globalData.recovered} of them have recovered and ${globalData.deaths} have died so far`;
    
          return handlerInput.responseBuilder
            .speak(speechText)
            .getResponse();
        } catch (error) {
          console.error(error);
        }
    }
};

const CaptureTopCountriesByCasesIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'CaptureTopCountriesByCasesIntent';
    },
    async handle(handlerInput) {
        const numberOfCountries = handlerInput.requestEnvelope.request.intent.slots.numberOfCountries.value;
        const numberOfCountiresChecked = (numberOfCountries === undefined || numberOfCountries === 0) ? 3 : (numberOfCountries > 30 ? 30 : numberOfCountries);
    
        try {
          const allCountriesOrderedByCases = await fetchDataOnTopCountiresWithCases();
          const topCountries = allCountriesOrderedByCases.slice(0, numberOfCountiresChecked);
          var countiesWithCases = "";
          for (let i = 0; i < topCountries.length; i++) {
            countiesWithCases = countiesWithCases + topCountries[i].country + " with " + topCountries[i].cases + " cases, ";
          }
          
          const speechText = `As of today, ` + numberOfCountiresChecked === 1 ? 
            `The country with the most confirmed cases is ` + countiesWithCases 
          : `Top ${numberOfCountiresChecked} countries with most confirmed cases are ` + countiesWithCases;
    
          return handlerInput.responseBuilder
            .speak(speechText)
            .getResponse();
        } catch (error) {
          console.error(error);
        }
    }
};

const CaptureTopStatesByCasesIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'CaptureTopStatesByCasesIntent';
    },
    async handle(handlerInput) {
        const numberOfStates = handlerInput.requestEnvelope.request.intent.slots.numberOfStates.value;
        const numberOfStatesChecked = (numberOfStates === undefined || numberOfStates === 0) ? 3 : (numberOfStates > 30 ? 30 : numberOfStates);
    
        try {
          const allStatesOrderedByCases = await fetchDataOnTopStatesWithCases();
          const topStates = allStatesOrderedByCases.slice(0, numberOfStatesChecked);
          var phrases = "";
          for (let i = 0; i < topStates.length; i++) {
            phrases = phrases + ` ${topStates[i].state} with ${topStates[i].cases} cases and ${topStates[i].deaths} deaths`;
          }
          
          const speechText = `As of today, ` + numberOfStatesChecked === 1 ? 
            `The state with the most confirmed cases is ` + phrases 
          : `Top ${numberOfStatesChecked} states in United States with most confirmed cases are ` + phrases;
    
          return handlerInput.responseBuilder
            .speak(speechText)
            .getResponse();
        } catch (error) {
          console.error(error);
        }
    }
};

const LoadUserStateInterceptor = {
    async process(handlerInput) {
        const attributesManager = handlerInput.attributesManager;
        const sessionAttributes = await attributesManager.getPersistentAttributes() || {};
        
        const userState = sessionAttributes.hasOwnProperty('userState') ? sessionAttributes.userState : 0;
        
        if (userState) {
            attributesManager.setSessionAttributes(sessionAttributes);
        }
    }
}

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'You can say hello to me! How can I help?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Goodbye!';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse();
    }
};

// The intent reflector is used for interaction model testing and debugging.
// It will simply repeat the intent the user said. You can create custom handlers
// for your intents by defining them above, then also adding them to the request
// handler chain below.
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

// Generic error handling to capture any syntax or routing errors. If you receive an error
// stating the request handler chain is not found, you have not implemented a handler for
// the intent being invoked or included it in the skill builder below.
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`~~~~ Error handled: ${error.stack}`);
        const speakOutput = `Sorry, I had trouble doing what you asked. Please try again.`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

// The SkillBuilder acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
exports.handler = Alexa.SkillBuilders.custom()
    .withPersistenceAdapter(
        new persistenceAdapter.S3PersistenceAdapter({bucketName:process.env.S3_PERSISTENCE_BUCKET})
    )
    .addRequestHandlers(
        CurrentStateIntentHandler,
        LaunchRequestHandler,
        CaptureStateIntentHandler,
        CaptureGlobalIntentHandler,
        CaptureCountryIntentHandler,
        CaptureTopCountriesByCasesIntentHandler,
        CaptureTopStatesByCasesIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler, // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
    )
    .addRequestInterceptors(
        LoadUserStateInterceptor
    )
    .addErrorHandlers(
        ErrorHandler,
    )
    .lambda();
