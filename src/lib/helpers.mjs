export function isPromise(obj) {
	return !!obj && (typeof obj === 'object' || typeof obj === 'function') && typeof obj.then === 'function';
}

export function hasPromises(arr) {
    return arr.length && arr.some(item => isPromise(item));
}

export function then (promiseOrResult, onFulfilled) {
	if (isPromise(promiseOrResult))
        return promiseOrResult.then(onFulfilled);
    
	return onFulfilled(promiseOrResult);
}
