# axios-rate-limit

[![npm version](https://img.shields.io/npm/v/rate-limit-ext.svg?style=flat-square)](https://www.npmjs.com/package/axios-rate-limit)
[![npm downloads](https://img.shields.io/npm/dt/rate-limit-ext.svg?style=flat-square)](https://www.npmjs.com/package/axios-rate-limit)

<!-- [![Build Status](https://img.shields.io/travis/aishek/rate-limit-ext.svg?style=flat-square)](https://travis-ci.org/aishek/axios-rate-limit) -->

Extended rate limit for axios: set how many requests per interval should perform immediately, other will be delayed automatically. Socket errors on long queues are fixed according to other axios-rate packeges.

## Installing

```bash
npm i rate-limit-ext
```

## Usage

```javascript
import axios from 'axios';
import RateLimitExt from 'rate-limit-ext';

//const axiosRate1 = new RateLimitExt(axiosInstance,options});
//available options : {
//  period: default 1000 // calcualtion period in millisecond
//  reqLimit: default 18 //  max request number for per period
//  reqPerSecond: default 18 // max request number for per second
//  countBeforeReq: default false // if it is true , rate calculations will done before sending request , otherwise calculation will done after any response or error received from axios
//}

// sets max 2 requests per 777 milliseconds, other will be delayed
// note reqPerSecond is a shorthand for period: 1000, and it takes precedence ,if specified both with reqPerSecond and period

const axiosRate1 = new RateLimitExt(axios.create(),{{ period: 777, reqLimit: 2 }});

// dont wait response of sended requests to trigger next requests on queue ,
const axiosRate2 = new RateLimitExt(axios.create(),{{ period: 777, reqLimit: 2 , countBeforeReq : true }});

//send max 20 request per  second , waits
const axiosRate3 = new RateLimitExt(axios.create(),{reqPerSecond: 5 });

axiosRate1.get('https://argatechnology.com/'); // will perform immediately
axiosRate1.get('https://argatechnology.com/'); // will perform immediately
axiosRate1.get('https://argatechnology.com/'); // will perform after 777 milliseconds from one of first 2 requests RESPONSE

axiosRate2.get('https://argatechnology.com/'); // will perform immediately
axiosRate2.get('https://argatechnology.com/'); // will perform immediately
axiosRate2.get('https://argatechnology.com/'); // will perform after 777 milliseconds from first one



//------------

axiosRate3.get('https://argatechnology.com/'); // will perform immediately
axiosRate3.get('https://argatechnology.com/'); // will perform immediately
axiosRate3.get('https://argatechnology.com/'); // will perform immediately
axiosRate3.get('https://argatechnology.com/'); // will perform immediately
axiosRate3.get('https://argatechnology.com/'); // will perform immediately
axiosRate3.get('https://argatechnology.com/'); // will perform after 1000 milliseconds from one of first 5 requests RESPONSE




```

## A bit of advertising :-)

As [TeamArga](https://teamarga.com/) , we have been developing javascript, python, c # projects since 2015.
Feel free to contact
