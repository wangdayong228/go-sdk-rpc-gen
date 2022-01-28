// TODO: create a web page tool
// const fs = require("fs")
const { toGoArgs, toGoArgNamesUsedInMethodBody, toGoInputForceConvertCode,
    toGoOutputDefineCode, toGoOutputReturnCode, getValNameInMethodBody } = require("./arg_handle")
const { convertType, ConvertKindEnum } = require("./go_type")
const { toAllCamel, toCamel } = require("../util")
const { isEvmSpace } = require("../env")
const debug = require("debug")("rpc_gen_from_rust")



function convertStruct(struct) {
    // console.log("struct", struct)
    const any = "[\\s\\S]"
    const regex = new RegExp(`(pub struct .*)\\{(${any}*)\\}`, "i")

    if (!regex.test(struct)) return ""

    let [, head, body] = struct.match(regex)

    const goHead = head.replace(/pub struct(.*)/, "type $1 struct")
    const goBody = body.replaceAll(new RegExp(`${any}*?pub (.*)?: (.*)?\\,`, "img"),
        (match, name, type) => `${toAllCamel(name)} ${convertType(type)} \`json:"${toCamel(name)}"\`\n`)
    return `${goHead}{\n${goBody}}`
}

function convertStructs(structs) {
    return structs
        .split("pub struct")
        .map(line => convertStruct("pub struct" + line))
        .join("\n")
}

function convertFunction(nameSpace, func) {
    const any = "[\\s\\S]"
    const regex = new RegExp(`(${any}*)?#\\[rpc.*?"(.*)?"\\)\\]${any}*?fn(${any}*)?\\(\\s*\\&self,*(${any}*)?\\)\\s*->\\s*.*?<(.*)?>`, "img")

    let goFunc = func.replaceAll(regex, (m, comment, rpcMethod, funName, args, returnType) => {
        debug("isEvmSpace", isEvmSpace)
        debug(`input force convert code: ${toGoInputForceConvertCode(args)}`)
        debug(`output define code: ${toGoOutputDefineCode(returnType)}`)
        debug(`output force convert code: ${toGoOutputReturnCode(returnType)}`)

        // args = convertArgs(args)
        const callMethod = isEvmSpace ? "Call" : "CallRPC"
        return `${comment || ''}func(c *Rpc${nameSpace}Client) ${toAllCamel(funName).replace(nameSpace, "")}(${toGoArgs(args, ConvertKindEnum.Interface)})(val ${convertType(returnType, ConvertKindEnum.Interface)}, err error) {
        ${toGoInputForceConvertCode(args)}
        ${toGoOutputDefineCode(returnType)}
        err = c.core.${callMethod}(&${getValNameInMethodBody(returnType)}, "${rpcMethod}", ${toGoArgNamesUsedInMethodBody(args)})
        ${toGoOutputReturnCode(returnType)}
        return
    }`})
    return goFunc
}

function convertTrait2Funcs(rsustTrait, nameSpace) {
    return rsustTrait
        .replace(/^.*?pub trait.*?\{/igs, "")
        .split(";")
        .map(line => convertFunction(nameSpace, line))
        .join("\n")
}

// function handleArgs(args, argReplaceHandler) {
//     if (!args) return ""

//     // const argReplaceFunc = (m, name, type) => `${toCamel(name)} ${isNeedType ? convertType(type, targetKind) : ""}`
//     return args.replace("\n", "")
//         .replace(/\s/g, '')
//         .replace(/,$/g, "")
//         .split(",")
//         .map(arg => arg.replace(/(.*)?:(.*)/g, argReplaceHandler)).join(", ")
// }


module.exports = {
    convertStruct,
    convertStructs,
    convertFunction,
    convertTrait2Funcs
}

// function run() {
//     const rustStructs = fs.readFileSync("/Users/wangdayong/myspace/mywork/web3go/types/parity/types.rs", "utf-8")

//     // console.log(convertTrait2Funcs(rust, "Eth"))
//     console.log(convertStructs(rustStructs))
// }
// run()


function run() {
    const rust = require('fs').readFileSync("/Users/wangdayong/myspace/mywork/web3go/tmp/rpc_traits/eth_conflux_rust.rs", "utf-8")
    // const rust = `    /// Returns the number of uncles in a block with given block number.
    // #[rpc(name = "eth_getUncleCountByBlockNumber")]
    // fn block_uncles_count_by_number(
    //     &self, blockNum: BlockNumber,
    // ) -> Result<Option<U256>>;`
    console.log(convertTrait2Funcs(rust, "Eth"))

    //     const rustStructs = `
    //     /// Block representation
    // #[derive(Debug, Serialize)]
    // #[serde(rename_all = "camelCase")]
    // pub struct Block {
    //     /// Hash of the block
    //     pub hash: Option<H256>,
    //     /// Hash of the parent
    //     pub parent_hash: H256,
    //     /// Hash of the uncles
    //     #[serde(rename = "sha3Uncles")]
    //     pub uncles_hash: H256,
    //     /// Size in bytes
    //     pub size: Option<U256>,
    // }
    //     `
    //     console.log(convertStructs(rustStructs))
}
run()
