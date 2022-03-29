import { Axios } from "axios";

class AstraService {
  constructor() {
    this.client = new Axios({
      baseURL: "https://api.astra.bar",
      validateStatus: (status) => status < 400,
    });

    this.client.interceptors.response.use((response) =>
      typeof response?.data === "string" ? JSON.parse(response?.data) : response?.data
    );
  }

  fetchBlockByHeight(height) {
    return this.client.get(`/blocks/${height}`);
  }

  fetchLatestBlock() {
    return this.client.get("/blocks/latest");
  }

  fetchStakingParams() {
    return this.client.get("/staking/parameters");
  }

  fetchStakingPool() {
    return this.client.get("/staking/pool");
  }

  fetchBankTotal(denom) {
    return this.client.get(`/bank/total/${denom}`);
  }

  fetchInflation() {
    return this.client.get("/cosmos/mint/v1beta1/inflation");
  }

  fetchValidators() {
    return this.client.get("/staking/validators");
  }

  fetchTxDetail(hash) {
    return this.client.get(`cosmos/tx/v1beta1/txs/${hash}`);
  }

  fetchAccountInfo(address) {
    return this.client.get(`auth/accounts/${address}`);
  }

  fetchAccountBalance(address) {
    return this.client.get(`bank/balances/${address}`);
  }

  fetchStakingRewards(address) {
    return this.client.get(`/cosmos/distribution/v1beta1/delegators/${address}/rewards`);
  }

  fetchStakingValidators(address) {
    return this.client.get(`/cosmos/distribution/v1beta1/delegators/${address}/validators`);
  }

  async fetchStakingDelegations(address) {
    const response = await this.client.get(`/cosmos/staking/v1beta1/delegations/${address}`);
    return response.delegation_responses;
  }

  async fetchStakingUnbounding(address) {
    const response = await this.client.get(`/cosmos/staking/v1beta1/delegators/${address}/unbonding_delegations`);
    return response.unbonding_responses;
  }

  getTxsBySender({ sender, page = 1, limit = 20 }) {
    return this.client.get(`/txs?message.sender=${sender}&page=${page}&limit=${limit}`);
  }
}

export default new AstraService();
