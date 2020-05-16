export function RateLimitExt(
  axios,
  { reqPerSecond, reqLimit, period, countBeforeReq }
) {
  let _period = 1000;
  let _countBeforeReq = !!countBeforeReq;
  let _reqLimit = 18;
  let _axios = axios;
  let queue = [];
  let lasts = [];

  if (!reqPerSecond) {
    period && (_period = period);
    reqLimit && (_reqLimit = reqLimit);
  } else {
    _reqLimit = reqPerSecond;
    _period = 1000;
  }

  const sendNext = async () => {
    const props = queue.shift();
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
    const availableData = isAvailable();
    if (availableData === 0) {
      await sendNext();
    } else if (availableData > 0) {
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
  const isAvailable = () => {
    if (updateLasts().length < _reqLimit) return 0;
    else {
      if (lasts.filter((el) => !el.finished).length >= _reqLimit) return -1;
      else {
        const len = lasts.length;
        for (let a = 0; a < len; a++) {
          if (lasts[a].finished)
            return _period - (Date.now() - lasts[a].millis);
        }
      }
    }
  };
  const updateLasts = () => {
    return (lasts = lasts.filter(
      (el) =>
        (!el.finished && !_countBeforeReq) || Date.now() - el.millis < _period
    ));
  };
  const handleReq = (props) => {
    if (isAvailable() === 0) return sendReq(props);
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
   * get request rate per second
   * @returns {Number} request rate per second
   */
  this.getRPS = function () {
    return _reqLimit / (_period / 1000);
  };
  /**
   * Set request limit for per second
   * @param {Number} requestPerSecond The value to test
   */
  this.setRPS = function (requestPerSecond) {
    _reqLimit = requestPerSecond;
    _period = 1000;
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
   * Set request limit for one period
   * @param {Number} reqLimit request limit
   */
  this.setReqLimit = function (reqLimit) {
    _reqLimit = reqLimit;
  };
  /**
   * Get request limit for one period
   * @returns {Number} request limit
   */
  this.getReqLimit = function () {
    return _reqLimit;
  };
}


