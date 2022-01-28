function toAllCamel(str) {
    let camel = toCamel(str)
    return camel.charAt(0).toUpperCase() + camel.substr(1)
}

function toCamel(str) {
    return str.trim().replace(/[-_](\w)/g, (m, c) => c.toUpperCase())
}

module.exports={
    toAllCamel,
    toCamel
}