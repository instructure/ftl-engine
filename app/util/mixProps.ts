function steal(result: any, data: any): any {
    for (var key in data) {
        let value = data[key]
        if (value.hasOwnProperty(key)) {
            result[key] = data[key];
        }
    }
    return result;
}

export class SameAs<a> {
    constructor(public result: a) { }
    public and<b>(value: b): SameAs<a & b> {
        return new SameAs<a & b>(steal(this.result, value));
    }
}
export function sameAs<a>(value: a): SameAs<a> {
    return new SameAs(steal({}, value));
}
