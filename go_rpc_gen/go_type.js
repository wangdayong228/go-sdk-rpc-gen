const { isEvmSpace } = require("../env")
const debug = require('debug')('go_type')

// input or output types of go rpc method
const goTypeInterface = {
    U64: isEvmSpace ? "uint64" : "hexutil.Uint64",
    U256: isEvmSpace ? "*big.Int" : "*hexutil.Big",
    H2048: isEvmSpace ? "types.Bloom" : "string",
    Bytes: isEvmSpace ? "[]byte" : "hexutil.Bytes",
}
// types used in go rpc method body
const goTypeMap = {
    "u64": "uint64",
    "U64": "hexutil.Uint64",
    "U256": "*hexutil.Big",
    "H160": "common.Address",
    "H256": isEvmSpace ? "common.Hash" : "types.Hash",
    "H2048": isEvmSpace ? "types.Bloom" : "string",
    "RpcAddress": "types.Address",
    "RpcTransaction": "types.Transaction",
    "String": "string",
    "Bytes": "hexutil.Bytes",
    "Index": "uint",
    "EthRpcLogFilter":"types.FilterQuery"
}

const ConvertKindEnum = {
    Interface: 0,
    MethodBody: 1
}

debug("isEvmSpace", isEvmSpace)
debug("goTypeInterface", goTypeInterface)
debug("goTypeMap", goTypeMap)

function convertType(rustType, targetKind) {
    if (/Option<(.*)>/.test(rustType)) {
        return rustType
            .replace(/Option<(.*)>/, (m, c) => `*${convertType(c, targetKind)}`)
            .replace("**", "*")
    }

    if (/Vec<(.*)>/.test(rustType)) {
        return rustType
            .replace(/Vec<(.*)>/, (m, c) => `[]${convertType(c, targetKind)}`)
    }

    const prefix = (isEvmSpace ? "types." : "")
    const typeForBody = goTypeMap[rustType] || prefix + rustType

    // console.trace()
    debug(`convertType(${rustType}, ${targetKind})+
    targetKind == ConvertKindEnum.MethodBody ${targetKind == ConvertKindEnum.MethodBody} +
    typeForBody ${typeForBody} +
    goTypeInterface[rustType] ${goTypeInterface[rustType]}
    `)

    if (targetKind == ConvertKindEnum.MethodBody) {
        return typeForBody
    } else {
        return goTypeInterface[rustType] || typeForBody
    }
}

function getCoreType(rustType) {
    let matched = rustType.match(/Option<(.*)>/)
    if (matched) return getCoreType(matched[1])

    matched = rustType.match(/Vec<(.*)>/)
    if (matched) return getCoreType(matched[1])

    return rustType
}

function isInterfaceTypeSame(rustType) {
    const core = getCoreType(rustType)
    const is = !goTypeInterface[core] || (goTypeInterface[core] == goTypeMap[core])
    // debug("isInterfaceTypeSame", rustType, is)
    return is
}

module.exports = {
    ConvertKindEnum,
    getCoreType,
    convertType,
    isInterfaceTypeSame
}