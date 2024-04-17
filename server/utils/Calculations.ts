

export function patchToNum(patch: string): number {
    const str = patch.split('.');
    return parseInt(str[0]) * 1000 + parseInt(str[1]);
}

export function getRandomSample<T>(arr: Array<T>, size: number): T[] {
    const sample = [];
    while (sample.length < size && arr.length > 0) {
        const index = Math.floor(Math.random() * arr.length);
        sample.push(arr.splice(index, 1)[0]);
    }
    return sample;
}

