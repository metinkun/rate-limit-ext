const myAxios = require('axios').default;
/**
 * Used by balance to get the balance data
 * @param {function} axios - axios instance not mandatory
 * @param {object} options - parameters
 * @param {number} options.weightLimit - weightlimit
 * @param {number} options.period - period in millisecond
 * @param {boolean} options.calculateBeforeResp - do rate calculations before responses
 * @return {object} - returns an axios instance with rate limitting
 */
function RateLimitWeight(axios, options) {
  // Weight based rate limitter
  let { weightLimit = 18, period = 1000, calculateBeforeResp = false } =
    options || {};
  if (typeof axios === 'object' && axios !== null) {
    // accept options as a first parameter
    axios.weightLimit && (weightLimit = axios.weightLimit);
    axios.period && (weightLimit = axios.period);
    axios.countBeforeResp && (weightLimit = axios.countBeforeResp);
    axios = myAxios.create();
  }
  let _period = period;
  let _countBeforeResp = calculateBeforeResp;
  let _weightLimit = weightLimit;
  let _axios = axios || myAxios.create();
  let queue = [];
  let lasts = [];

  const popNext = () => queue.shift();

  const sendNext = async (props) => {
    if (!props) return;
    try {
      const res = await sendReq(props);
      props.resolve(res);
    } catch (err) {
      props.reject(err);
    }
  };
  const onFinish = async (lastObj) => {
    lastObj.finished = true;
    lastObj.millis = Date.now();
    if (!queue.length) return;
    const availableData = isAvailable(queue[0].weight);
    if (availableData === 0) {
      const next = popNext();
      sendNext(next);
    } else if (availableData > 0) {
      const next = popNext();
      setTimeout(() => {
        sendNext(next);
      }, availableData);
    }
  };
  const sendReq = async (props) => {
    const lastObj = {
      millis: Date.now(),
      finished: false,
      weight: props.weight,
    };
    lasts.push(lastObj);
    try {
      const res = await _axios[props.type].apply(this, props.arguments);
      await onFinish(lastObj);
      return res;
    } catch (err) {
      await onFinish(lastObj);
      throw err;
    }
  };
  const calcWeights = (newWeight) => {
    let availableOn = -2;
    let lastFinished = 0;
    let unFinisheds = 0;
    let total = 0;
    lasts.forEach((el) => {
      if (!el.finished) unFinisheds += el.weight;
      else if (el.millis > lastFinished) lastFinished = el.millis;
      total += el.weight;
    });

    if (total + newWeight < _weightLimit) availableOn = 0;
    else if (unFinisheds + newWeight >= _weightLimit) {
      availableOn = -1;
    } else {
      let finisheds = lasts.filter((el) => el.finished);
      finisheds = lasts.sort((a, b) => b.millis - a.millis);
      let weights = 0;
      const len = finisheds.length;
      for (var a = 0; a < len; a++) {
        weights += finisheds[a].weight;
        if (total + newWeight - weights < _weightLimit) {
          availableOn = _period - (Date.now() - finisheds[a].millis);
          break;
        }
      }
    }
    if (availableOn === -2) throw 'unexpected error';
    return availableOn;
  };

  const isAvailable = (newWeight) => {
    updateLasts();
    return calcWeights(newWeight);
  };
  const updateLasts = () => {
    return (lasts = lasts.filter(
      (el) =>
        (!el.finished && !_countBeforeResp) || Date.now() - el.millis < _period
    ));
  };
  const handleReq = (props) => {
    const args = [...props.arguments];
    props.weight = args[0];
    props.arguments = args.slice(1);

    if (isAvailable(props.weight) === 0) return sendReq(props);
    else {
      return new Promise((resolve, reject) => {
        props.resolve = resolve;
        props.reject = reject;
        queue.push(props);
      });
    }
  };

  this.get = function () {
    const props = { type: 'get', arguments };

    return handleReq(props);
  };
  this.post = function () {
    const props = { type: 'post', arguments };
    return handleReq(props);
  };
  this.delete = function () {
    const props = { type: 'delete', arguments };
    return handleReq(props);
  };
  this.put = function () {
    const props = { type: 'put', arguments };
    return handleReq(props);
  };
  this.request = function () {
    const props = { type: 'request', arguments };
    return handleReq(props);
  };
  this.patch = function () {
    const props = { type: 'patch', arguments };
    return handleReq(props);
  };
  /**
   * Set period of rate calculation
   * @param {Number} period period in milliseconds
   */
  this.setPeriod = function (period) {
    _period = period;
  };
  /**
   * Get period of rate calculation
   * @returns {Number} period in milliseconds
   */
  this.getPeriod = function () {
    return _period;
  };
  /**
   * Set weight limit for each period
   * @param {Number} reqLimit request limit
   */
  this.setWeightLimit = function (weightLimit) {
    _weightLimit = weightLimit;
  };
  /**
   * Get weight limit for each period
   * @returns {Number} request limit
   */
  this.getWeightLimit = function () {
    return _weightLimit;
  };
}

module.exports = RateLimitWeight;
