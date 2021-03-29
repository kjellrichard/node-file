const fs = require('fs');
const { promisify } = require('util');
const { resolve } = require('path');
const [readFile, writeFile, deleteFile] = [promisify(fs.readFile), promisify(fs.writeFile), promisify(fs.unlink)];


async function readLines(filename, transform = null) {
    let content = await readFile(filename, 'utf8')
    if (content.charCodeAt(0) === 0xFEFF) {
        content = content.substr(1);
    }
    const lines = content
        .split('\n')
        .map(l => l.replace(/\r/ig, ''))
        .filter(l => !!l);
    if (!transform)
        return lines;
    return lines.map((l, i) => transform(l, i));
}

async function writeCsv(collection, filename, {
    separator = ';',
    replacement = '_',
    skipFields = [],
    columns = false,
    capitalize = false,
    dateFormat = 'dateOnly',
    verbose = true } = {}
) {
    if (!collection.length) {
        verbose && console.log(`Collection is empty. No file written`)
        return { written: false };
    }
    const fields = columns || Object.keys(collection[0]).filter(v => skipFields.indexOf(v) === -1);
    const lines = collection.map(member => {
        return fields.reduce((acc, value) => {
            let v = member[value];
            if (dateFormat === 'dateOnly' && v && v.getFullYear)
                v = v.toISOString().substr(0, 10);
            if (v && v.replace)
                v = v.replace(separator, replacement)
            acc.push(v);
            return acc;
        }, []).join(separator)
    });
    const fieldNames = fields.map(f => {
        if (capitalize)
            return f.charAt(0).toUpperCase() + f.slice(1)
        return f;
    })
    await writeFile(filename, [fieldNames.join(separator), ...lines].join('\n'));
    verbose && console.log(`${collection.length} rows written to ${filename}`);
    return { filename };
}

module.exports = {
    resolve,
    readFile,
    writeFile,
    readLines,
    writeCsv,
    deleteFile
}