import moment from "moment";
import { Bech32, fromBase64, fromHex, toHex } from "@cosmjs/encoding";
import { sha256 } from "@cosmjs/crypto";
import { decodeTxRaw } from "@cosmjs/proto-signing";
import Tx from "../libs/data/tx";

const COUNT_ABBRS = ["", "K", "M", "B", "t", "q", "s", "S", "o", "n", "d", "U", "D", "T", "Qt", "Qd", "Sd", "St"];

export function numberWithCommas(x) {
  const parts = x.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

export function formatNumber(count, withAbbr = false, decimals = 2) {
  const i = count === 0 ? count : Math.floor(Math.log(count) / Math.log(1000));
  let result = parseFloat((count / 1000 ** i).toFixed(decimals));
  if (withAbbr && COUNT_ABBRS[i]) {
    result += `${COUNT_ABBRS[i]}`;
  }
  return result;
}

export function formatTokenAmount(tokenAmount, fraction = 2, denom = "uatom") {
  let amount;
  if (denom.startsWith("inj")) {
    // eslint-disable-next-line no-undef
    amount = Number(BigInt(Number(tokenAmount)) / 1000000000000000000n);
    // }
  } else if (denom.startsWith("rowan")) {
    // eslint-disable-next-line no-undef
    amount = Number(BigInt(Number(tokenAmount)) / 1000000000000000000n);
    // }
  } else if (denom.startsWith("basecro")) {
    amount = Number(tokenAmount) / 100000000;
  } else if (denom.startsWith("nanolike")) {
    amount = Number(tokenAmount) / 1000000000;
  } else {
    amount = Number(tokenAmount) / 1000000;
  }
  if (amount > 10) {
    return parseFloat(amount.toFixed(fraction));
  }
  return parseFloat(amount);
}

export function formatSpecificTokenAmount(tokenAmount, fraction = 2, tokenDenom = "uatom", format = true) {
  const denom = tokenDenom.denom_trace ? tokenDenom.denom_trace.base_denom : tokenDenom;
  let amount = 0;

  let exp = 6;
  amount = Number(Number(tokenAmount)) / 10 ** exp;
  if (amount > 10) {
    if (format) {
      return numberWithCommas(parseFloat(amount.toFixed(fraction)));
    }
    return parseFloat(amount.toFixed(fraction));
  }
  return parseFloat(amount.toFixed(fraction));
}

export function percent(num) {
  return parseFloat((num * 100).toFixed(2));
}

export function abbr(string, length = 6, suffix = "...") {
  if (string && string.length > length) {
    return `${string.substring(0, length)}${suffix}`;
  }
  return string;
}

export function abbrAddress(address, length = 10) {
  return address.substring(0, length).concat("...", address.substring(address.length - length));
}

export function consensusPubkeyToHexAddress(consensusPubkey) {
  let raw = null;
  if (typeof consensusPubkey === "object") {
    raw = toHex(fromBase64(consensusPubkey.value));
  } else {
    raw = toHex(Bech32.decode(consensusPubkey).data).toUpperCase().replace("1624DE6420", "");
  }
  const address = toHex(sha256(fromHex(raw)))
    .slice(0, 40)
    .toUpperCase();
  return address;
}

export function getStakingValidatorByHex(hex) {
  const locals = localStorage.getItem("validators");
  if (locals) {
    const val = JSON.parse(locals).find((x) => consensusPubkeyToHexAddress(x.consensus_pubkey) === hex);
    if (val) {
      return val.description.moniker;
    }
  }
  return abbr(hex);
}

export function getStakingValidatorOperator(addr, length = -1) {
  const locals = localStorage.getItem("validators");
  if (locals) {
    const val = JSON.parse(locals).find((x) => x.operator_address === addr);
    if (val) {
      return val.description.moniker;
    }
  }
  if (length > 0) {
    return addr.substring(addr.length - length);
  }
  return addr;
}

export function decodeTx(rawTx) {
  try {
    const origin = decodeTxRaw(fromBase64(rawTx));
    const tx = Tx.create(origin);
    tx.setHash(rawTx);
    return tx;
  } catch {
    return null;
  }
}

export function formatTokenDenom(tokenDenom) {
  if (tokenDenom) {
    let denom = tokenDenom.denom_trace ? tokenDenom.denom_trace.base_denom.toUpperCase() : tokenDenom.toUpperCase();
    if (denom.charAt(0) === "U" && denom !== "USDX") {
      denom = denom.substring(1);
    } else if (denom === "BASECRO") {
      denom = "CRO";
    } else if (denom.startsWith("IBC")) {
      denom = "IBC...";
    } else if (denom.startsWith("NANOLIKE")) {
      denom = "LIKE";
    }

    return denom;
  }
  return "";
}

export function formatToken(token, IBCDenom = {}, decimals = 2) {
  if (token) {
    return `${formatSpecificTokenAmount(token.amount, decimals, token.denom)} ${formatTokenDenom(
      IBCDenom[token.denom] || token.denom
    )}`;
  }
  return token;
}

export function tokenFormatter(tokens, denoms = {}) {
  if (Array.isArray(tokens)) {
    return tokens.map((t) => formatToken(t, denoms, 2)).join();
  }
  return formatToken(tokens, denoms, 2);
}

export function abbrMessage(msg) {
  if (Array.isArray(msg)) {
    const sum = msg
      .map((x) => abbrMessage(x))
      .reduce((s, c) => {
        const sh = s;
        if (sh[c]) {
          sh[c] += 1;
        } else {
          sh[c] = 1;
        }
        return sh;
      }, {});
    const output = [];
    Object.keys(sum).forEach((k) => {
      output.push(`${k}×${sum[k]}`);
    });
    return output.join(", ");
  }
  if (msg.typeUrl) {
    return msg.typeUrl.substring(msg.typeUrl.lastIndexOf(".") + 1).replace("Msg", "");
  }
  return msg.type.substring(msg.type.lastIndexOf("/") + 1).replace("Msg", "");
}

export function toDay(time, format = "long") {
  if (format === "long") {
    return moment(time).format("YYYY-MM-DD HH:mm");
  }
  if (format === "date") {
    return moment(time).format("YYYY-MM-DD");
  }
  if (format === "time") {
    return moment(time).format("HH:mm:ss");
  }
  if (format === "from") {
    return moment(time).fromNow();
  }
  if (format === "to") {
    return moment(time).toNow();
  }
  return moment(time).format("YYYY-MM-DD HH:mm:ss");
}
