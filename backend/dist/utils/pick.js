const pick = (obj, keys) => {
    return keys.reduce((finalObj, key) => {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (obj && Object.hasOwnProperty.call(obj, key)) {
            finalObj[key] = obj[key];
        }
        return finalObj;
    }, {});
};
export default pick;
