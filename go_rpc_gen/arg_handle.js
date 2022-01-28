const { convertType, ConvertKindEnum, isInterfaceTypeSame } = require("./go_type")
const { toCamel } = require("../util")

function handleArgs(args, argReplaceHandler) {
    if (!args) return []

    // const argReplaceFunc = (m, name, type) => `${toCamel(name)} ${isNeedType ? convertType(type, targetKind) : ""}`
    return args.replace("\n", "")
        .replace(/\s/g, '')
        .replace(/,$/g, "")
        .split(",")
        .map(arg => arg.replace(/(.*)?:(.*)/g, argReplaceHandler))
}

function toGoArgs(args, targetKind) {
    const toGoArgHandler = (m, name, type) => `${toCamel(name)} ${convertType(type, targetKind)}`
    return handleArgs(args, toGoArgHandler).join(", ")
}

function toGoArgNames(args) {
    const toGoArgHandler = (m, name, type) => `${toCamel(name)}`
    return handleArgs(args, toGoArgHandler).join(", ")
}

function toGoArgNamesUsedInMethodBody(args) {
    const toGoArgHandler = (m, name, type) => isInterfaceTypeSame(type) ? `${toCamel(name)}` : `_${toCamel(name)}`
    return handleArgs(args, toGoArgHandler).join(", ")
}

function toGoInputForceConvertCode(args) {
    const toGoArgHandler = (m, name, type) => {
        // console.log(`toGoInputForceConvertCode ${name} ${type}, ${isInterfaceTypeSame(type)}`)
        if (isInterfaceTypeSame(type)) return ""
        const targetType = convertType(type, ConvertKindEnum.MethodBody)
        return `_${toCamel(name)}:=(${targetType})(${toCamel(name)})`
    }
    return handleArgs(args, toGoArgHandler).join("\n").trim()
}

function toGoOutputDefineCode(rustType) {
    if (isInterfaceTypeSame(rustType)) return ""
    return `var _val ${convertType(rustType, ConvertKindEnum.MethodBody)}`
}

function toGoOutputReturnCode(rustType) {
    if (isInterfaceTypeSame(rustType)) return ""
    return `val = (${convertType(rustType, ConvertKindEnum.Interface)})(_val)`
}

function getValNameInMethodBody(rustType) {
    if (isInterfaceTypeSame(rustType)) return "val"
    return "_val"
}

module.exports = {
    handleArgs,
    toGoArgs,
    toGoArgNames,
    toGoArgNamesUsedInMethodBody,
    toGoInputForceConvertCode,
    toGoOutputDefineCode,
    toGoOutputReturnCode,
    getValNameInMethodBody
}