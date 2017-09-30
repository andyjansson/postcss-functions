export function isPromise(obj) {
	return !!obj && (typeof obj === 'object' || typeof obj === 'function') && typeof obj.then === 'function';
}

export function hasPromises(arr) {
    return arr.some(item => isPromise(item));
}

export function then (promiseOrResult, onFulfilled) {
	if (isPromise(promiseOrResult))
        return promiseOrResult.then(onFulfilled);
    
	return onFulfilled(promiseOrResult);
}

export function index(arr) {
	return arr.reduce((index, el) => {
		index[el] = true;
		return index;
	}, {});
}