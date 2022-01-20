//Init Code, Initial Counter and Imports
import { sleep, group, check } from "k6";
import http from "k6/http";
import { Trend, Rate, Counter, Gauge } from 'k6/metrics';
import { SharedArray } from 'k6/data';

const countryName = new SharedArray('countryName', function () {
  return JSON.parse(open('./countryName.json'));
});
export const counterErrors = new Counter('Errors');
let success = new Counter("successful_Search");
let checkFailureRate = new Rate("check_failure_rate");
/////////////////////////////////////////////////////
////////////////*********************////////////////
/////////////////////////////////////////////////////
export const options = {

  stages: [
    { duration: "1m", target: 50},
    { duration: "2m", target: 50 },
	{ duration: "10s", target: 75 },
	{ duration: "2m", target: 75 },
	{ duration: "10s", target: 100 },
	{ duration: "2m", target: 100 },
	{ duration: "10s", target: 125 },
	{ duration: "2m", target: 125 },
	{ duration: "10s", target: 150 },
	{ duration: "2m", target: 150 },
	{ duration: "10s", target: 300 },
	{ duration: "10s", target: 150 },
	{ duration: "30s", target: 150 },
	{ duration: "30s", target: 100 },
	{ duration: "30s", target: 50 },
	{ duration: "30s", target: 0 },
  ],
  thresholds: {
		checkFailureRate: ['rate<0.20'], // http errors should be less than 20%
		http_req_duration: ['p(95)<2000'], // 95% of requests should be below 2000ms
		'Errors': ['count<5000'],
  },
};
/////////////////////////////////////////////////////
////////////////*********************////////////////
/////////////////////////////////////////////////////
export default function main() {
  let response;

  group("page_1 - https://duckduckgo.com/", function () {
    response = http.get("https://duckduckgo.com/", {
    });
      // check() function to verify status code, transaction time etc
  let checkRes = check(response, {
    "status main page, code 200": (r) => r.status == 200,
    "transaction Response Main time OK": (r) => r.timings.duration < 2000
  });
          checkFailureRate.add(!checkRes);
	if (checkRes) {
            success.add(1);
        }
		else
		{  
			counterErrors.add(1);
		}
	sleep(1.0);
  });

  group("page_2 - https://duckduckgo.com/?q=perf&t=h_", function () {

	const randomCountry = countryName[Math.floor(Math.random() * countryName.length)].countryName;
	//console.log('Random countryName: ', JSON.stringify(randomCountry));
	//console.log('Random countryName: ', randomCountry);
	
	response = http.get(http.url`https://duckduckgo.com/?q=${randomCountry.toString()}&t=h_`);
	
		//Assertion URL Parameterization
	//console.log(JSON.stringify(response.url));
	
    let checkRes =   check(response, {
    "status search page, code 200": (r) => r.status == 200,
    "transaction Response Search time OK": (r) => r.timings.duration < 2000
  });
          checkFailureRate.add(!checkRes);

	if (checkRes) {
            success.add(1);
        }
		else
		{  
			counterErrors.add(1);
		}	
	sleep(1.0);
	
  });      
}
