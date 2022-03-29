import Token from "./token";

export default class StdTx {
  constructor() {
    this.type = "";
    this.fee = [new Token()];
    this.gas = 0;
    this.memo = "";
    this.messages = null;
    this.signatures = [];
    this.timeout_height = 0;
  }

  static create(element) {
    const self = new StdTx();
    self.type = element["@type"];
    self.fee = element.auth_info.fee.amount;
    self.gas = element.auth_info.fee.gas_limit;
    self.memo = element.body.memo;
    self.messages = element.body.messages;
    self.signatures = element.signatures;
    self.timeout_height = element.body.timeout_height;
    return self;
  }
}
