import myAxios from 'axios';
/**
 * Used by balance to get the balance data
 * @param {function} axios - axios instance not mandatory
 * @param {object} options - parameters
 * @param {number} options.weigthLimit - weigthlimit
 * @param {number} options.period - period in millisecond
 * @param {boolean} options.calculateBeforeResp - do rate calculations before responses
 * @return {object} - returns an axios instance with rate limitting
 */
export function RateLimitWeigth(axios, options) {
  // Weigth based rate limitter
  const {
    weigthLimit = 18,
    period = 1000,
    calculateBeforeResp = false,
  } = options;
  if (typeof axios === 'object' && axios !== null) {
    // accept options as a first parameter
    axios.weigthLimit && (weigthLimit = axios.weigthLimit);
    axios.period && (weigthLimit = axios.period);
    axios.countBeforeResp && (weigthLimit = axios.countBeforeResp);
    axios = myAxios.create();
  }
  let _period = period;
  let _countBeforeResp = calculateBeforeResp;
  let _weigthLimit = weigthLimit;
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
    const availableData = isAvailable(queue[0].weigth);
    if (availableData === 0) {
      popNext();
      await sendNext();
    } else if (availableData > 0) {
      popNext();
      setTimeout(() => {
        sendNext();
      }, availableData);
    }
  };
  const sendReq = async (props) => {
    const lastObj = {
      millis: Date.now(),
      finished: false,
    };
    lasts.push(lastObj);
    try {
      const res = await _axios[props.type](...props.arguments);
      await onFinish(lastObj);
      return res;
    } catch (err) {
      await onFinish(lastObj);
      throw err;
    }
  };
  const calcWeigths = (newWeigth) => {
    let availableOn = -2;
    let lastFinished = 0;
    let unFinisheds = 0;
    let total = 0;
    lasts.forEach((el) => {
      if (!el.finished) unFinisheds += el.weigth;
      else if (el.millis > lastFinished) lastFinished = el.millis;
      total += el.weigth;
    });

    if (total + newWeigth < _weigthLimit) availableOn = 0;
    else if (unFinisheds + newWeigth >= _weigthLimit) {
      availableOn = -1;
    } else {
      let finisheds = lasts.filter((el) => el.finished);
      finisheds = lasts.sort((a, b) => b.millis - a.millis);
      let weigths = 0;
      const len = finisheds.length;
      for (var a = 0; a < len; a++) {
        weigths += finisheds[a].weigth;
        if (total + newWeigth - weigths < _weigthLimit) {
          availableOn = _period - (Date.now() - finisheds[a].millis);
          break;
        }
      }
    }
    if (availableOn === -2) throw 'unexpected error';
    return availableOn;
  };

  const isAvailable = (newWeigth) => {
    updateLasts();
    return calcWeigths(newWeigth);
  };
  const updateLasts = () => {
    return (lasts = lasts.filter(
      (el) =>
        (!el.finished && !_countBeforeResp) || Date.now() - el.millis < _period
    ));
  };
  const handleReq = (props) => {
    props.weigth = props.arguments[0];
    props.arguments = props.arguments.slice(1);

    if (isAvailable(props.weigth) === 0) return sendReq(props);
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
   * Set weigth limit for each period
   * @param {Number} reqLimit request limit
   */
  this.setWeigthLimit = function (weigthLimit) {
    _weigthLimit = weigthLimit;
  };
  /**
   * Get weigth limit for each period
   * @returns {Number} request limit
   */
  this.getWeigthLimit = function () {
    return _weigthLimit;
  };
}
